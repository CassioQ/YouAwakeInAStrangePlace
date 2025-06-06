import { FieldValue, Timestamp } from "firebase/firestore";
import { Skill } from "./Character.types";
import { GameSetupPhase } from "./enums/CommomEnuns";

export type GameServerStatus = "lobby" | "in-progress" | "finished";

export interface PlayerInLobby {
  userId: string;
  playerName: string;
  characterId?: string | null;
  characterName?: string | null;
  skills?: Skill[] | null;
  avatarUrl?: string | null;
}

export interface PlayerRoll {
  playerId: string;
  playerName: string;
  rollValue: number;
  rolledAt: Date | Timestamp; // Keep as Date for client-side, convert to Timestamp for Firestore
}

export interface WorldDefinitionPart {
  value?: string;
  definedByPlayerId?: string;
  definedByPlayerName?: string;
}

export interface WorldDefinition {
  genre?: WorldDefinitionPart;
  adjective?: WorldDefinitionPart;
  location?: WorldDefinitionPart;
}

export interface WorldTruth {
  truth: string;
  definedByPlayerId: string;
  definedByPlayerName: string;
  order: number; // 1-indexed for display clarity
}

export interface GameSetupState {
  currentPhase: GameSetupPhase;
  numPlayersAtSetupStart: number;
  playerRolls: PlayerRoll[];
  definitionOrder?: string[];
  currentPlayerIdToDefine?: string | null;
  worldDefinition: WorldDefinition;
  interferenceTokens?: { [playerId: string]: number };

  // Fields for World Truths
  worldTruths?: WorldTruth[];
  currentPlayerTruthIndex?: number; // Index in definitionOrder for current truth definer
}

export interface GameServer {
  id: string;
  serverName: string;
  password?: string;
  gmId: string;
  createdAt: FieldValue;
  players: PlayerInLobby[];
  status: GameServerStatus;
  lastActivityAt: FieldValue;
  gmLastSeenAt: FieldValue;
  gameSetup?: GameSetupState;
}
