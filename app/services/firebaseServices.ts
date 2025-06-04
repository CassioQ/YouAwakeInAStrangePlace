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
  arrayRemove,
  FieldValue,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { auth, User } from "../../firebase";
import {
  GameServer,
  PlayerInLobby,
  GameServerStatus,
  GameSetupState,
  PlayerRoll,
} from "../models/GameServer.types";
import { UserProfile } from "../models/UserProfile.types";
import {
  ScreenEnum,
  UserRole,
  GameSetupPhase,
} from "../models/enums/CommomEnuns";

const db = getFirestore();

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  const userProfileRef = doc(db, "userProfiles", userId);
  try {
    await setDoc(userProfileRef, { userId, ...profileData }, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Falha ao atualizar perfil do usuário.");
  }
};

export const fetchUserProfileData = async (
  userId: string
): Promise<UserProfile | null> => {
  const userProfileRef = doc(db, "userProfiles", userId);
  try {
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    const basicProfile: UserProfile = {
      userId,
      activeGmServerId: null,
      activePlayerServerId: null,
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(userProfileRef, basicProfile);
    return basicProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const updateUserActiveServerId = async (
  userId: string,
  role: UserRole,
  serverId: string | null
): Promise<void> => {
  const profileUpdate: Partial<UserProfile> = {};
  if (role === UserRole.GM) {
    profileUpdate.activeGmServerId = serverId;
  } else if (role === UserRole.PLAYER) {
    profileUpdate.activePlayerServerId = serverId;
  }
  await updateUserProfile(userId, profileUpdate);
};

export const updateServerTimestamps = async (
  serverId: string,
  isGmActive: boolean = false
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  const updateData: { lastActivityAt: FieldValue; gmLastSeenAt?: FieldValue } =
    {
      lastActivityAt: serverTimestamp(),
    };
  if (isGmActive) {
    updateData.gmLastSeenAt = serverTimestamp();
  }
  try {
    await updateDoc(serverDocRef, updateData);
  } catch (error) {
    console.error("Error updating server timestamps:", error);
  }
};

export const createGameServer = async (
  serverName: string,
  password?: string
): Promise<GameServer | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("No current user found to create server.");
    throw new Error("Usuário não autenticado para criar servidor.");
  }

  const q = query(
    collection(db, "gameServers"),
    where("serverName", "==", serverName)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    throw new Error("Já existe um servidor com este nome.");
  }

  const newServerRef = doc(collection(db, "gameServers"));
  const newServerData: Omit<
    GameServer,
    "id" | "createdAt" | "lastActivityAt" | "gmLastSeenAt"
  > & {
    createdAt: FieldValue;
    lastActivityAt: FieldValue;
    gmLastSeenAt: FieldValue;
  } = {
    serverName,
    password: password || "",
    gmId: currentUser.uid,
    createdAt: serverTimestamp(),
    players: [],
    status: "lobby",
    lastActivityAt: serverTimestamp(),
    gmLastSeenAt: serverTimestamp(),
  };

  try {
    await setDoc(newServerRef, newServerData);
    await updateUserActiveServerId(
      currentUser.uid,
      UserRole.GM,
      newServerRef.id
    );

    const serverSnap = await getDoc(newServerRef);
    if (serverSnap.exists()) {
      return { id: serverSnap.id, ...serverSnap.data() } as GameServer;
    }
    return null;
  } catch (error) {
    console.error("Error creating game server:", error);
    throw new Error("Falha ao criar o servidor no banco de dados.");
  }
};

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

export const joinGameServer = async (
  serverName: string,
  password?: string,
  currentUser?: User | null
): Promise<GameServer | null> => {
  if (!currentUser) {
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

    const playerLobbyData: PlayerInLobby = {
      userId: currentUser.uid,
      playerName:
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Jogador Anônimo",
      characterId: null,
      characterName: null,
      skills: null,
      avatarUrl:
        currentUser.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email?.split("@")[0] || "P")}&background=random&size=100`,
    };

    const playerAlreadyJoined = serverData.players?.some(
      (p) => p.userId === currentUser.uid
    );
    if (!playerAlreadyJoined) {
      await updateDoc(serverDoc.ref, {
        players: arrayUnion(playerLobbyData),
      });
    }

    await updateUserActiveServerId(
      currentUser.uid,
      UserRole.PLAYER,
      serverDoc.id
    );
    await updateServerTimestamps(serverDoc.id, false);

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

export const leaveGameServer = async (
  serverId: string,
  playerId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (serverSnap.exists()) {
      const serverData = serverSnap.data() as GameServer;
      const playerToRemove = serverData.players.find(
        (p) => p.userId === playerId
      );
      if (playerToRemove) {
        await updateDoc(serverDocRef, {
          players: arrayRemove(playerToRemove),
          lastActivityAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error("Error leaving game server:", error);
    throw new Error("Falha ao sair do servidor.");
  }
};

export const deleteGameServer = async (
  serverId: string,
  gmId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (serverSnap.exists()) {
      const serverData = serverSnap.data() as GameServer;
      if (serverData.gmId === gmId) {
        await deleteDoc(serverDocRef);
        console.log(`Server ${serverId} deleted by GM ${gmId}`);
      } else {
        throw new Error("Somente o mestre do jogo pode deletar este servidor.");
      }
    }
  } catch (error) {
    console.error("Error deleting game server:", error);
    throw error;
  }
};

export const startGame = async (
  serverId: string,
  playersInLobby: PlayerInLobby[]
): Promise<boolean> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const initialGameSetup: GameSetupState = {
      currentPhase: GameSetupPhase.ROLLING,
      numPlayersAtSetupStart: playersInLobby.length,
      playerRolls: [],
      worldDefinition: {},
      definitionOrder: [],
      interferenceTokens: {},
      currentPlayerIdToDefine: null,
    };

    await updateDoc(serverDocRef, {
      status: "in-progress" as GameServerStatus,
      gameSetup: initialGameSetup, // Initialize gameSetup
      lastActivityAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error starting game and initializing setup:", error);
    return false;
  }
};

export const listenToServerStatus = (
  serverId: string,
  onStatusUpdate: (status: GameServerStatus, gameSetup?: GameSetupState) => void
): Unsubscribe => {
  const serverDocRef = doc(db, "gameServers", serverId);
  return onSnapshot(serverDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverData = docSnap.data() as GameServer;
      onStatusUpdate(serverData.status || "lobby", serverData.gameSetup);
    } else {
      onStatusUpdate("lobby", undefined);
    }
  });
};

export const listenToGameSetup = (
  serverId: string,
  onGameSetupUpdate: (gameSetup?: GameSetupState) => void
): Unsubscribe => {
  const serverDocRef = doc(db, "gameServers", serverId);
  return onSnapshot(serverDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverData = docSnap.data() as GameServer;
      onGameSetupUpdate(serverData.gameSetup);
    } else {
      onGameSetupUpdate(undefined);
    }
  });
};

export const submitPlayerRoll = async (
  serverId: string,
  playerId: string,
  playerName: string,
  rollValue: number
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  const playerRollData: PlayerRoll = {
    playerId,
    playerName,
    rollValue,
    rolledAt: new Date(),
  };

  try {
    // It's important to ensure that a player can only add their roll once.
    // A more robust way would be a transaction or a cloud function.
    // For client-side, we'll rely on UI disabling after roll.
    // We also need to fetch the document to not overwrite existing rolls.
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) {
      throw new Error("Servidor não encontrado para submeter rolagem.");
    }
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      gameSetup &&
      gameSetup.playerRolls.find((p) => p.playerId === playerId)
    ) {
      console.warn(`Player ${playerId} already rolled.`);
      return; // Already rolled
    }

    await updateDoc(serverDocRef, {
      "gameSetup.playerRolls": arrayUnion(playerRollData),
      "gameSetup.lastRollAt": serverTimestamp(), // Optional: track last roll time for ordering
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error submitting player roll:", error);
    throw new Error("Falha ao submeter rolagem de dados.");
  }
};
