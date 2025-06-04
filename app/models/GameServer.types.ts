import { FieldValue } from "firebase/firestore";
import { Skill } from "./Character.types";

export type GameServerStatus = "lobby" | "in-progress" | "finished";

export interface PlayerInLobby {
  userId: string; // Firebase UID of the player
  playerName: string; // Firebase display name or email part
  characterId?: string | null;
  characterName?: string | null;
  skills?: Skill[] | null;
  avatarUrl?: string | null;
}

export interface GameServer {
  id: string; // Firestore document ID
  serverName: string;
  password?: string;
  gmId: string; // Firebase UID of the GM
  createdAt: FieldValue;
  players: PlayerInLobby[];
  status: GameServerStatus;
  lastActivityAt: FieldValue; // Timestamp of the last meaningful activity
  gmLastSeenAt: FieldValue; // Timestamp of when the GM was last active in the lobby
}
