import { FieldValue, Timestamp } from "firebase/firestore";
import { GameSetupPhase, GamePhase } from "./enums/CommomEnuns"; // Added GamePhase

export type GameServerStatus = "lobby" | "in-progress" | "finished"; // This might be deprecated by GamePhase

export interface PlayerInLobby {
  userId: string;
  playerName: string;
  characterId?: string | null;
  characterName?: string | null;
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

export interface WorldTruth {
  truth: string;
  definedByPlayerId: string;
  definedByPlayerName: string;
  order: number;
}

export interface PlayerConceptEntry {
  playerId: string;
  playerName: string;
  concept: string;
  submitted: boolean;
}

export interface DefinedSkill {
  skillName: string;
  definedByPlayerId: string;
  definedByPlayerName: string;
  type: "player" | "gm";
}

export interface PlayerSkillAllocation {
  totalToDefine: number;
  definedCount: number;
  finalized: boolean;
}

export interface PlayerSkillModifierChoice {
  skillName: string;
  modifierValue: number; // +2, +1, -1, -2
}

export interface PlayerModifierSelectionStatus {
  assignedModifiers: number[]; // Stores the values (+2, +1, -1, -2) that have been used
  finalized: boolean;
}

export interface GameSetupState {
  currentPhase: GameSetupPhase;
  numPlayersAtSetupStart: number;
  playerRolls: PlayerRoll[];
  definitionOrder?: string[];
  currentPlayerIdToDefine?: string | null;
  worldDefinition: WorldDefinition;
  interferenceTokens?: { [playerId: string]: number };

  worldTruths?: WorldTruth[];
  currentPlayerTruthIndex?: number;

  characterConcepts?: PlayerConceptEntry[];
  allConceptsSubmitted?: boolean;

  skillRolls?: PlayerRoll[];
  allSkillRollsSubmitted?: boolean;

  skillsPerPlayerAllocation?: { [playerId: string]: PlayerSkillAllocation };
  currentPlayerSkillDefOrderIndex?: number;

  definedSkills?: DefinedSkill[];
  gmSkillsDefinedCount?: number;

  playerSkillModifiers?: { [playerId: string]: PlayerSkillModifierChoice[] };
  playerModifierSelectionStatus?: {
    [playerId: string]: PlayerModifierSelectionStatus;
  };
}

// Gameplay specific state
export interface PlayerGameplayState {
  userId: string;
  characterName: string;
  avatarUrl?: string;
  maxHp: number;
  currentHp: number;
  assignedSkills: PlayerSkillModifierChoice[]; // The 4 chosen skills with their modifiers
  interferenceTokens: number; // Added for interference tokens
}

export interface GameLogEntry {
  id: string; // Unique ID for the log entry (e.g., timestamp + random string)
  timestamp: FieldValue | Timestamp; // Allow both FieldValue for writing and Timestamp for reading
  type: "roll" | "chat" | "info" | "system" | "token" | "generic_roll"; // Added "generic_roll" & "token" type
  playerId?: string; // ID of the player who performed the action or sent the message
  playerName?: string; // Name of the player
  message: string; // Main text of the log (e.g., "rolled Perception (+1) and got 12")
  rollDetails?: {
    skillName?: string; // Optional for generic rolls
    diceResult: [number, number]; // [d1, d2]
    modifier?: number; // Optional for generic rolls
    totalRoll: number;
  };
}

export interface GameplayState {
  playerStates: { [playerId: string]: PlayerGameplayState }; // Keyed by playerId
  gameLog: GameLogEntry[];
  currentTurnPlayerId?: string | null; // For future turn-based actions
}

export interface GameServer {
  id: string;
  serverName: string;
  password?: string;
  gmId: string;
  createdAt: FieldValue;
  players: PlayerInLobby[];
  status: GameServerStatus;
  gamePhase?: GamePhase;
  lastActivityAt: FieldValue;
  gmLastSeenAt: FieldValue;
  gameSetup?: GameSetupState | null;
  gameplay?: GameplayState;
}
