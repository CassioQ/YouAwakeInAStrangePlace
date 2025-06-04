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
  password?: string; // WARNING: Storing passwords in plain text is insecure for production
  gmId: string; // Firebase UID of the GM
  createdAt: FieldValue; // Firestore ServerTimestamp on write, Timestamp on read
  players: PlayerInLobby[];
  status: GameServerStatus; // New field: 'lobby', 'in-progress', 'finished'
}
