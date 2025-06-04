import { FieldValue } from "firebase/firestore";
import { Skill } from "./Character.types";

export interface PlayerInLobby {
  userId: string; // Firebase UID of the player
  characterId: string; // ID of the character they are using
  playerName: string;
  characterName: string;
  skills: Skill[];
  avatarUrl?: string;
}

export interface GameServer {
  id: string; // Firestore document ID
  serverName: string;
  password?: string; // WARNING: Storing passwords in plain text is insecure for production
  gmId: string; // Firebase UID of the GM
  createdAt: FieldValue;
  players: PlayerInLobby[];
}
