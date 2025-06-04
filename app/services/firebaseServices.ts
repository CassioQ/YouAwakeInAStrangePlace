import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  FieldValue,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { auth, User } from "../../firebase"; // Assuming User is FirebaseUser
import { GameServer, PlayerInLobby } from "../models/GameServer.types";
import { Character } from "../models/Character.types";

const db = getFirestore();

/**
 * Creates a new game server in Firestore.
 * @param serverName The name of the server.
 * @param password The server password (store hashed in production).
 * @returns The ID of the created server, or null on failure.
 */
export const createGameServer = async (
  serverName: string,
  password?: string
): Promise<GameServer | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("No current user found to create server.");
    return null;
  }

  // Check if server name already exists (simple check, can be made more robust)
  const q = query(
    collection(db, "gameServers"),
    where("serverName", "==", serverName)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    console.error("Server name already exists.");
    throw new Error("Já existe um servidor com este nome.");
  }

  const newServerRef = doc(collection(db, "gameServers"));
  const newServerData: Omit<GameServer, "id" | "createdAt"> & {
    createdAt: FieldValue;
  } = {
    serverName,
    password: password || "", // WARNING: Insecure, hash in production
    gmId: currentUser.uid,
    createdAt: serverTimestamp(),
    players: [],
  };

  try {
    await setDoc(newServerRef, newServerData);
    const createdServer: GameServer = {
      ...newServerData,
      id: newServerRef.id,
    };
    return createdServer;
  } catch (error) {
    console.error("Error creating game server:", error);
    return null;
  }
};

/**
 * Fetches a game server's details from Firestore.
 * @param serverId The ID of the server.
 * @returns The GameServer object or null if not found/error.
 */
export const getGameServerDetails = async (
  serverId: string
): Promise<GameServer | null> => {
  try {
    const serverDocRef = doc(db, "gameServers", serverId);
    const serverSnap = await getDoc(serverDocRef);
    if (serverSnap.exists()) {
      return { id: serverSnap.id, ...serverSnap.data() } as GameServer;
    }
    return null;
  } catch (error) {
    console.error("Error fetching server details:", error);
    return null;
  }
};

/**
 * Sets up a real-time listener for players in a specific game server.
 * @param serverId The ID of the server to listen to.
 * @param onPlayersUpdate Callback function to handle player updates.
 * @returns An unsubscribe function for the listener.
 */
export const listenToLobbyPlayers = (
  serverId: string,
  onPlayersUpdate: (players: PlayerInLobby[]) => void
): Unsubscribe => {
  const serverDocRef = doc(db, "gameServers", serverId);
  return onSnapshot(serverDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverData = docSnap.data() as GameServer;
      onPlayersUpdate(serverData.players || []);
    } else {
      onPlayersUpdate([]); // Server deleted or doesn't exist
    }
  });
};

/**
 * Allows a player to join a game server.
 * @param serverName The name of the server to join.
 * @param password The password for the server.
 * @param character The character the player is joining with.
 * @param currentUser The current Firebase user.
 * @returns True if successfully joined, false otherwise.
 */
export const joinGameServer = async (
  serverName: string,
  password?: string,
  character?: Character | null, // Make character optional or ensure it's always passed
  currentUser?: User | null
): Promise<string | null> => {
  // Returns serverId if joined, null otherwise
  if (!character || !currentUser) {
    console.error("Character or user not available for joining server.");
    return null;
  }

  const q = query(
    collection(db, "gameServers"),
    where("serverName", "==", serverName)
  );
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error("Servidor não encontrado.");
    }

    const serverDoc = querySnapshot.docs[0];
    const serverData = serverDoc.data() as GameServer;

    // WARNING: Direct password comparison is insecure.
    if (serverData.password && serverData.password !== password) {
      throw new Error("Senha do servidor incorreta.");
    }

    // Check if player is already in the lobby to prevent duplicates
    const playerAlreadyJoined = serverData.players?.some(
      (p) => p.userId === currentUser.uid && p.characterId === character.id
    );
    if (playerAlreadyJoined) {
      console.log("Player already in lobby with this character.");
      return serverDoc.id; // Or handle as a re-join/confirmation
    }

    const playerLobbyData: PlayerInLobby = {
      userId: currentUser.uid,
      characterId: character.id,
      playerName:
        character.playerName || currentUser.displayName || "Jogador Anônimo",
      characterName: character.name,
      skills: character.skills,
      avatarUrl: character.avatarUrl,
    };

    await updateDoc(serverDoc.ref, {
      players: arrayUnion(playerLobbyData),
    });
    return serverDoc.id;
  } catch (error) {
    console.error("Error joining game server:", error);
    throw error; // Re-throw to be caught by UI
  }
};
