import { FieldValue, Timestamp } from "firebase/firestore";
import { Skill } from "./Character.types"; // Assuming Skill might be reused or adapted
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

export interface WorldTruth {
  truth: string;
  definedByPlayerId: string;
  definedByPlayerName: string;
  order: number;
}

// New interfaces for character creation phase
export interface PlayerConceptEntry {
  playerId: string;
  playerName: string;
  concept: string;
  submitted: boolean;
}

export interface DefinedSkill {
  skillName: string;
  definedByPlayerId: string; // Player or GM ID
  definedByPlayerName: string;
  type: "player" | "gm";
}

export interface PlayerSkillAllocation {
  totalToDefine: number;
  definedCount: number;
  finalized: boolean; // Player has confirmed their skill choices for this turn/allocation
}

export interface GameSetupState {
  currentPhase: GameSetupPhase;
  numPlayersAtSetupStart: number;
  playerRolls: PlayerRoll[]; // For initial world definition order
  definitionOrder?: string[]; // Player IDs sorted by initial roll
  currentPlayerIdToDefine?: string | null; // Player ID for current world def or skill def turn
  worldDefinition: WorldDefinition;
  interferenceTokens?: { [playerId: string]: number };

  worldTruths?: WorldTruth[];
  currentPlayerTruthIndex?: number;

  // Character Creation Fields
  characterConcepts?: PlayerConceptEntry[];
  allConceptsSubmitted?: boolean;

  skillRolls?: PlayerRoll[]; // For skill definition order
  allSkillRollsSubmitted?: boolean;

  skillsPerPlayerAllocation?: { [playerId: string]: PlayerSkillAllocation };
  currentPlayerSkillDefOrderIndex?: number; // Index for skill definition turn based on sorted skillRolls

  definedSkills?: DefinedSkill[];
  gmSkillsDefinedCount?: number;
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
