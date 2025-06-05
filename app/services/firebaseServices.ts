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
  WorldDefinition,
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

    if (serverData.status !== "lobby") {
      throw new Error("Este servidor não está mais aceitando novos jogadores.");
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
      gameSetup: initialGameSetup,
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

export const processPlayerRollsAndAssignDefinitions = async (
  serverId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  const serverSnap = await getDoc(serverDocRef);

  if (!serverSnap.exists()) {
    throw new Error("Servidor não encontrado para processar rolagens.");
  }
  const serverData = serverSnap.data() as GameServer;
  const gameSetup = serverData.gameSetup;

  if (!gameSetup || gameSetup.currentPhase !== GameSetupPhase.ROLLING) {
    console.warn("Não é a hora de processar rolagens ou gameSetup não existe.");
    return;
  }

  const sortedRolls = [...gameSetup.playerRolls].sort((a, b) => {
    if (b.rollValue !== a.rollValue) {
      return b.rollValue - a.rollValue;
    }
    // Tie-breaking: earlier roll wins
    const aTime =
      a.rolledAt instanceof Timestamp
        ? a.rolledAt.toMillis()
        : new Date(a.rolledAt).getTime();
    const bTime =
      b.rolledAt instanceof Timestamp
        ? b.rolledAt.toMillis()
        : new Date(b.rolledAt).getTime();
    return aTime - bTime;
  });

  const definitionOrderFromRolls = sortedRolls.map((roll) => roll.playerId);
  const interferenceTokens: { [playerId: string]: number } = {};

  const numPlayers = gameSetup.numPlayersAtSetupStart;

  if (numPlayers > 3) {
    for (let i = 3; i < definitionOrderFromRolls.length; i++) {
      interferenceTokens[definitionOrderFromRolls[i]] = 1; // Or some other logic
    }
  }

  const newGameSetupUpdate: Partial<GameSetupState> = {
    currentPhase: GameSetupPhase.DEFINING_GENRE,
    definitionOrder: definitionOrderFromRolls,
    currentPlayerIdToDefine:
      definitionOrderFromRolls.length > 0 ? definitionOrderFromRolls[0] : null,
    interferenceTokens: interferenceTokens,
  };

  await updateDoc(serverDocRef, {
    gameSetup: { ...gameSetup, ...newGameSetupUpdate },
    lastActivityAt: serverTimestamp(),
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
    rolledAt: new Date(), // Client-side Date, converted to Timestamp on write by Firestore
  };

  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) {
      throw new Error("Servidor não encontrado para submeter rolagem.");
    }
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (!gameSetup) {
      throw new Error("Configuração do jogo não iniciada.");
    }

    const existingRollIndex = gameSetup.playerRolls.findIndex(
      (p) => p.playerId === playerId
    );
    let updatedRolls = [...gameSetup.playerRolls];

    if (existingRollIndex > -1) {
      // Player is re-rolling or updating, replace their roll
      updatedRolls[existingRollIndex] = playerRollData;
    } else {
      updatedRolls.push(playerRollData);
    }

    const updatePayload: any = {
      "gameSetup.playerRolls": updatedRolls,
      "gameSetup.lastRollAt": serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    };

    await updateDoc(serverDocRef, updatePayload);

    // Check if all players have rolled
    if (updatedRolls.length === gameSetup.numPlayersAtSetupStart) {
      await processPlayerRollsAndAssignDefinitions(serverId);
    }
  } catch (error) {
    console.error("Error submitting player roll:", error);
    throw new Error("Falha ao submeter rolagem de dados.");
  }
};

export const submitWorldDefinitionPart = async (
  serverId: string,
  playerId: string,
  playerName: string,
  definitionType: "genre" | "adjective" | "location",
  value: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);

  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) {
      throw new Error("Servidor não encontrado.");
    }
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      !gameSetup.definitionOrder ||
      gameSetup.definitionOrder.length === 0
    ) {
      throw new Error("Ordem de definição não está pronta ou vazia.");
    }
    if (gameSetup.currentPlayerIdToDefine !== playerId) {
      throw new Error("Não é sua vez de definir esta parte.");
    }

    const worldDefinitionUpdate: Partial<WorldDefinition> = {
      [definitionType]: {
        value,
        definedByPlayerId: playerId,
        definedByPlayerName: playerName,
      },
    };

    let nextPhase = gameSetup.currentPhase;
    let nextPlayerIdToDefine: string | null = null;

    const numPlayers = gameSetup.numPlayersAtSetupStart;
    const currentDefinitionOrder = gameSetup.definitionOrder; // Use the existing order

    const updatedWorldDefinition = {
      ...gameSetup.worldDefinition,
      ...worldDefinitionUpdate,
    };

    if (definitionType === "genre") {
      nextPhase = GameSetupPhase.DEFINING_ADJECTIVE;
      nextPlayerIdToDefine =
        numPlayers === 1
          ? currentDefinitionOrder[0]
          : currentDefinitionOrder[1 % currentDefinitionOrder.length];
    } else if (definitionType === "adjective") {
      nextPhase = GameSetupPhase.DEFINING_LOCATION;
      if (numPlayers === 1) nextPlayerIdToDefine = currentDefinitionOrder[0];
      else if (numPlayers === 2)
        nextPlayerIdToDefine = currentDefinitionOrder[0]; // Player 1 defines genre & location
      else
        nextPlayerIdToDefine =
          currentDefinitionOrder[2 % currentDefinitionOrder.length];
    } else if (definitionType === "location") {
      nextPhase = GameSetupPhase.CHARACTER_CREATION;
      nextPlayerIdToDefine = null;
    }

    await updateDoc(serverDocRef, {
      "gameSetup.worldDefinition": updatedWorldDefinition,
      "gameSetup.currentPhase": nextPhase,
      "gameSetup.currentPlayerIdToDefine": nextPlayerIdToDefine,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error submitting world definition part:", error);
    throw new Error("Falha ao submeter definição.");
  }
};
