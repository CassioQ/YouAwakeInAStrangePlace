import {
  getFirestore,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import {
  GameServer,
  GameplayState,
  GameLogEntry,
} from "../models/GameServer.types";
import {
  GamePhase,
  GameLogEntryType,
  GameSetupPhase,
} from "../models/enums/CommomEnuns";

const db = getFirestore();

export const listenToGameplayState = (
  serverId: string,
  onGameplayUpdate: (gameplay?: GameplayState) => void
): Unsubscribe => {
  const serverDocRef = doc(db, "gameServers", serverId);
  return onSnapshot(serverDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverData = docSnap.data() as GameServer;
      onGameplayUpdate(serverData.gameplay);
    } else {
      onGameplayUpdate(undefined);
    }
  });
};

export const initiateGameplaySession = async (
  serverId: string,
  gmId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists())
      throw new Error("Servidor não encontrado para iniciar o jogo.");
    const serverData = serverSnap.data() as GameServer;

    if (serverData.gmId !== gmId) {
      throw new Error("Apenas o Mestre pode iniciar a sessão de jogo.");
    }
    if (
      !serverData.gameSetup ||
      serverData.gameSetup.currentPhase !== GameSetupPhase.AWAITING_GAME_START
    ) {
      throw new Error(
        "A configuração do jogo ainda não foi concluída por todos."
      );
    }
    if (
      !serverData.gameSetup.playerModifierSelectionStatus ||
      !serverData.players.every(
        (p) =>
          serverData.gameSetup!.playerModifierSelectionStatus![p.userId]
            ?.finalized
      )
    ) {
      throw new Error(
        "Nem todos os jogadores finalizaram a atribuição de modificadores."
      );
    }

    const initialGameplayState: GameplayState = {
      playerStates: {},
      gameLog: [],
      currentTurnPlayerId: null,
    };

    const characterConcepts = serverData.gameSetup.characterConcepts || [];
    const playerSkillModifiers =
      serverData.gameSetup.playerSkillModifiers || {};
    const interferenceTokensSetup =
      serverData.gameSetup.interferenceTokens || {};

    serverData.players.forEach((player) => {
      const concept = characterConcepts.find(
        (c) => c.playerId === player.userId
      );
      const skills = playerSkillModifiers[player.userId] || [];

      initialGameplayState.playerStates[player.userId] = {
        userId: player.userId,
        characterName: concept?.concept || player.playerName,
        avatarUrl: player.avatarUrl ?? undefined,
        maxHp: 10,
        currentHp: 10,
        assignedSkills: skills,
        interferenceTokens: interferenceTokensSetup[player.userId] || 0,
        isIncapacitated: false,
      };
    });

    initialGameplayState.gameLog.push({
      id: `${Date.now()}-systemStart`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.SYSTEM,
      message: "A sessão de jogo foi iniciada pelo Mestre!",
    });

    await updateDoc(serverDocRef, {
      gamePhase: GamePhase.ACTIVE,
      gameplay: initialGameplayState,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error initiating gameplay session:", error);
    throw error;
  }
};

export const rollSkillDiceForGameplay = async (
  serverId: string,
  playerId: string,
  playerName: string,
  skillName: string,
  modifier: number
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;

    if (!serverData.gameplay || serverData.gamePhase !== GamePhase.ACTIVE) {
      throw new Error("O jogo não está ativo para realizar esta ação.");
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = d1 + d2 + modifier;

    const logEntries: GameLogEntry[] = [];

    logEntries.push({
      id: `${Date.now()}-${playerId}-roll`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.ROLL,
      playerId,
      playerName,
      message: `${playerName} rolou ${skillName} (${modifier >= 0 ? "+" : ""}${modifier}) e obteve ${totalRoll}. (Dados: ${d1}, ${d2})`,
      rollDetails: {
        skillName,
        diceResult: [d1, d2],
        modifier,
        totalRoll,
      },
    });

    const updates: any = {
      "gameplay.gameLog": arrayUnion(...logEntries), // Spread log entries
      lastActivityAt: serverTimestamp(),
    };

    if (d1 === 6 && d2 === 6) {
      const currentTokens =
        serverData.gameplay.playerStates[playerId]?.interferenceTokens || 0;
      updates[`gameplay.playerStates.${playerId}.interferenceTokens`] =
        currentTokens + 1;

      logEntries.push({
        id: `${Date.now()}-${playerId}-boxcarsToken`,
        timestamp: Timestamp.now(),
        type: GameLogEntryType.TOKEN,
        playerId,
        playerName,
        message: `${playerName} tirou 6-6 e ganhou 1 Token de Interferência!`,
      });
      updates["gameplay.gameLog"] = arrayUnion(...logEntries);
    }

    await updateDoc(serverDocRef, updates);
  } catch (error) {
    console.error("Error rolling skill dice for gameplay:", error);
    throw error;
  }
};

export const rollGenericDiceForGameplay = async (
  serverId: string,
  playerId: string,
  playerName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;

    if (!serverData.gameplay || serverData.gamePhase !== GamePhase.ACTIVE) {
      throw new Error("O jogo não está ativo para realizar esta ação.");
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = d1 + d2;

    const logEntries: GameLogEntry[] = [];

    logEntries.push({
      id: `${Date.now()}-${playerId}-genericRoll`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.GENERIC_ROLL,
      playerId,
      playerName,
      message: `${playerName} rolou 2d6 e obteve ${totalRoll}. (Dados: ${d1}, ${d2})`,
      rollDetails: {
        diceResult: [d1, d2],
        totalRoll,
        skillName: "Rolagem Genérica",
        modifier: 0,
      },
    });

    const updates: any = {
      "gameplay.gameLog": arrayUnion(...logEntries),
      lastActivityAt: serverTimestamp(),
    };

    if (d1 === 6 && d2 === 6) {
      const currentTokens =
        serverData.gameplay.playerStates[playerId]?.interferenceTokens || 0;
      updates[`gameplay.playerStates.${playerId}.interferenceTokens`] =
        currentTokens + 1;

      logEntries.push({
        id: `${Date.now()}-${playerId}-boxcarsTokenGeneric`,
        timestamp: Timestamp.now(),
        type: GameLogEntryType.TOKEN,
        playerId,
        playerName,
        message: `${playerName} tirou 6-6 em uma rolagem genérica e ganhou 1 Token de Interferência!`,
      });
      updates["gameplay.gameLog"] = arrayUnion(...logEntries);
    }

    await updateDoc(serverDocRef, updates);
  } catch (error) {
    console.error("Error rolling generic dice for gameplay:", error);
    throw error;
  }
};

export const rollGmSkillForGameplay = async (
  serverId: string,
  gmId: string,
  gmName: string,
  skillName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;

    if (!serverData.gameplay || serverData.gamePhase !== GamePhase.ACTIVE) {
      throw new Error("O jogo não está ativo para realizar esta ação.");
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = d1 + d2;

    const logEntry: GameLogEntry = {
      id: `${Date.now()}-${gmId}-gmRoll`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.ROLL,
      playerId: gmId,
      playerName: gmName,
      message: `${gmName} (Mestre) usou '${skillName}' e rolou ${totalRoll}. (Dados: ${d1}, ${d2})`,
      rollDetails: {
        skillName,
        diceResult: [d1, d2],
        modifier: 0,
        totalRoll,
      },
    };

    await updateDoc(serverDocRef, {
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error rolling GM skill for gameplay:", error);
    throw error;
  }
};

export const useInterferenceToken = async (
  serverId: string,
  playerId: string,
  playerName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;

    if (!serverData.gameplay || serverData.gamePhase !== GamePhase.ACTIVE) {
      throw new Error("O jogo não está ativo para usar um token.");
    }

    const playerState = serverData.gameplay.playerStates[playerId];
    if (!playerState) throw new Error("Estado do jogador não encontrado.");

    if (playerState.interferenceTokens <= 0) {
      throw new Error("Você não tem tokens de interferência para usar.");
    }

    const updatedTokens = playerState.interferenceTokens - 1;

    const logEntry: GameLogEntry = {
      id: `${Date.now()}-${playerId}-token`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.TOKEN,
      playerId,
      playerName,
      message: `${playerName} usou um Token de Interferência!`,
    };

    await updateDoc(serverDocRef, {
      [`gameplay.playerStates.${playerId}.interferenceTokens`]: updatedTokens,
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error using interference token:", error);
    throw error;
  }
};

export const updatePlayerCurrentHpGM = async (
  serverId: string,
  targetPlayerId: string,
  newHp: number,
  gmName: string,
  targetPlayerName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const logEntry: GameLogEntry = {
      id: `${Date.now()}-gmHpUpdate`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.SYSTEM,
      playerName: gmName,
      message: `${gmName} (Mestre) alterou os Pontos de Vida de ${targetPlayerName} para ${newHp}.`,
    };
    await updateDoc(serverDocRef, {
      [`gameplay.playerStates.${targetPlayerId}.currentHp`]: newHp,
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating player HP by GM:", error);
    throw new Error("Falha ao atualizar HP do jogador.");
  }
};

export const updatePlayerCurrentHpSelf = async (
  serverId: string,
  playerId: string,
  newHp: number,
  playerName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const logEntry: GameLogEntry = {
      id: `${Date.now()}-playerHpUpdate`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.SYSTEM,
      playerId: playerId,
      playerName: playerName,
      message: `${playerName} atualizou seus Pontos de Vida para ${newHp}.`,
    };
    await updateDoc(serverDocRef, {
      [`gameplay.playerStates.${playerId}.currentHp`]: newHp,
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating player HP by self:", error);
    throw new Error("Falha ao atualizar seus Pontos de Vida.");
  }
};

export const updatePlayerInterferenceTokensGM = async (
  serverId: string,
  targetPlayerId: string,
  newAmount: number,
  gmName: string,
  targetPlayerName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const logEntry: GameLogEntry = {
      id: `${Date.now()}-gmTokenUpdate`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.SYSTEM,
      playerName: gmName,
      message: `${gmName} (Mestre) alterou os Tokens de Interferência de ${targetPlayerName} para ${newAmount}.`,
    };
    await updateDoc(serverDocRef, {
      [`gameplay.playerStates.${targetPlayerId}.interferenceTokens`]: newAmount,
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating player tokens by GM:", error);
    throw new Error("Falha ao atualizar tokens do jogador.");
  }
};

export const updatePlayerIncapacitatedStatusGM = async (
  serverId: string,
  targetPlayerId: string,
  isNowIncapacitated: boolean,
  gmName: string,
  targetPlayerName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const logEntry: GameLogEntry = {
      id: `${Date.now()}-gmIncapacitatedUpdate`,
      timestamp: Timestamp.now(),
      type: GameLogEntryType.SYSTEM,
      playerName: gmName,
      message: `${gmName} (Mestre) marcou ${targetPlayerName} como ${isNowIncapacitated ? "incapacitado(a)" : "ativo(a)"}.`,
    };
    await updateDoc(serverDocRef, {
      [`gameplay.playerStates.${targetPlayerId}.isIncapacitated`]:
        isNowIncapacitated,
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating player incapacitated status by GM:", error);
    throw new Error("Falha ao atualizar status de incapacitação do jogador.");
  }
};
