import { FieldValue, Timestamp } from "firebase/firestore";
import { Skill } from "./Character.types"; // Assuming Skill might be reused or adapted
import { GameSetupPhase } from "./enums/CommomEnuns";

export type GameServerStatus = "lobby" | "in-progress" | "finished";

export interface PlayerInLobby {
  userId: string;
  playerName: string;
  characterId?: string | null;
  characterName?: string | null;
  skills?: Skill[] | null; // This might be populated after character creation
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
