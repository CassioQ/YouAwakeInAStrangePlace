import { GameServer } from "../models/GameServer.types";

export const getPlayerNameById = (
  playerId: string,
  serverDetails: GameServer | null
): string => {
  if (!serverDetails) return "Jogador Desconhecido";
  if (playerId === serverDetails.gmId) return "Mestre";
  const player = serverDetails.players.find((p) => p.userId === playerId);
  return player?.playerName || "Jogador Desconhecido";
};
