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
  rolledAt: Date | Timestamp;
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

export interface GameSetupState {
  currentPhase: GameSetupPhase;
  numPlayersAtSetupStart: number;
  playerRolls: PlayerRoll[];
  definitionOrder?: string[];
  currentPlayerIdToDefine?: string | null;
  worldDefinition: WorldDefinition;
  interferenceTokens?: { [playerId: string]: number };
  // Add other setup related fields here, e.g., character creation progress
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
