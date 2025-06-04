import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

initializeApp();
const db = getFirestore();

const SERVER_CLEANUP_THRESHOLD_HOURS = 72;

export const cleanupStaleGameServers = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async () => {
    logger.info("Iniciando limpeza de salas de jogo obsoletas...");

    const now = Timestamp.now();
    const thresholdMillis = SERVER_CLEANUP_THRESHOLD_HOURS * 60 * 60 * 1000;
    const cutoffTimestamp = Timestamp.fromMillis(
      now.toMillis() - thresholdMillis
    );

    const gameServersRef = db.collection("gameServers");

    const staleServersQuery = gameServersRef
      .where("gmLastSeenAt", "<", cutoffTimestamp)
      .orderBy("gmLastSeenAt");

    try {
      const snapshot = await staleServersQuery.get();

      if (snapshot.empty) {
        logger.info("Nenhuma sala obsoleta encontrada para limpeza.");
        return;
      }

      const batch = db.batch();
      let deleteCount = 0;

      snapshot.forEach((doc) => {
        const server = doc.data() as { players?: any[]; serverName?: string };
        if (!server.players || server.players.length === 0) {
          logger.info(
            `Deletando sala obsoleta: ${doc.id} (Nome: ${server.serverName || "N/A"})`
          );
          batch.delete(doc.ref);
          deleteCount++;
        }
      });

      if (deleteCount > 0) {
        await batch.commit();
        logger.info(`${deleteCount} salas obsoletas foram deletadas.`);
      } else {
        logger.info(
          "Nenhuma sala realmente vazia e com GM inativo foi deletada."
        );
      }
    } catch (error) {
      logger.error("Erro durante a limpeza de salas obsoletas:", error);
    }
  }
);
