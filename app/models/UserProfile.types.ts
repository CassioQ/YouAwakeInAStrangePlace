import { FieldValue } from "firebase/firestore";

export interface UserProfile {
  userId: string;
  displayName?: string | null;
  email?: string | null;
  activeGmServerId?: string | null; // ID of the server they are GMing
  activePlayerServerId?: string | null; // ID of the server they are playing in
  lastLoginAt?: FieldValue;
}
