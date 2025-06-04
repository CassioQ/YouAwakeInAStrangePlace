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
import {
  GameServer,
  PlayerInLobby,
  GameServerStatus,
} from "../models/GameServer.types";
// Character type is no longer needed for initial lobby join by player
// import { Character } from "../models/Character.types";

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
    password: password || "",
    gmId: currentUser.uid,
    createdAt: serverTimestamp(),
    players: [],
    status: "lobby", // Initial status
  };

  try {
    await setDoc(newServerRef, newServerData);
    // Fetch the document to get the server-resolved timestamp and full data
    const serverSnap = await getDoc(newServerRef);
    if (serverSnap.exists()) {
      return { id: serverSnap.id, ...serverSnap.data() } as GameServer;
    }
    return null; // Should not happen if setDoc was successful
  } catch (error) {
    console.error("Error creating game server:", error);
    throw new Error("Falha ao criar o servidor no banco de dados.");
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
      onPlayersUpdate([]);
    }
  });
};

/**
 * Allows a player to join a game server.
 * Player identity is based on their Firebase User account.
 * @param serverName The name of the server to join.
 * @param password The password for the server.
 * @param currentUser The current Firebase user.
 * @returns The joined GameServer object or null if failed.
 */
export const joinGameServer = async (
  serverName: string,
  password?: string,
  currentUser?: User | null // currentUser now directly passed
): Promise<GameServer | null> => {
  if (!currentUser) {
    console.error("User not available for joining server.");
    throw new Error("Usuário não autenticado.");
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
    const serverData = { id: serverDoc.id, ...serverDoc.data() } as GameServer;

    if (serverData.password && serverData.password !== password) {
      throw new Error("Senha do servidor incorreta.");
    }

    const playerAlreadyJoined = serverData.players?.some(
      (p) => p.userId === currentUser.uid
    );
    if (playerAlreadyJoined) {
      console.log("Player already in lobby.");
      return serverData;
    }

    const playerLobbyData: PlayerInLobby = {
      userId: currentUser.uid,
      playerName:
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Jogador Anônimo",
      // Character details are deferred
      characterId: null,
      characterName: null, // Or "Aguardando Personagem"
      skills: null, // Or []
      avatarUrl:
        currentUser.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email?.split("@")[0] || "P")}&background=random&size=100`,
    };

    await updateDoc(serverDoc.ref, {
      players: arrayUnion(playerLobbyData),
    });

    // Fetch the updated document to return the latest player list
    const updatedServerSnap = await getDoc(serverDoc.ref);
    if (updatedServerSnap.exists()) {
      return {
        id: updatedServerSnap.id,
        ...updatedServerSnap.data(),
      } as GameServer;
    }
    return null;
  } catch (error) {
    console.error("Error joining game server:", error);
    throw error;
  }
};

/**
 * Updates the server status to 'in-progress'.
 * @param serverId The ID of the server to start.
 * @returns True if successful, false otherwise.
 */
export const startGame = async (serverId: string): Promise<boolean> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    await updateDoc(serverDocRef, {
      status: "in-progress" as GameServerStatus,
    });
    return true;
  } catch (error) {
    console.error("Error starting game:", error);
    return false;
  }
};

/**
 * Sets up a real-time listener for the status of a specific game server.
 * @param serverId The ID of the server to listen to.
 * @param onStatusUpdate Callback function to handle status updates.
 * @returns An unsubscribe function for the listener.
 */
export const listenToServerStatus = (
  serverId: string,
  onStatusUpdate: (status: GameServerStatus) => void
): Unsubscribe => {
  const serverDocRef = doc(db, "gameServers", serverId);
  return onSnapshot(serverDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverData = docSnap.data() as GameServer;
      onStatusUpdate(serverData.status || "lobby");
    } else {
      onStatusUpdate("lobby");
    }
  });
};
