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
  WorldTruth,
  PlayerConceptEntry,
  DefinedSkill,
  PlayerSkillAllocation,
  PlayerSkillModifierChoice,
  PlayerModifierSelectionStatus,
  GameplayState,
  PlayerGameplayState,
  GameLogEntry,
} from "../models/GameServer.types";
import { UserProfile } from "../models/UserProfile.types";
import {
  ScreenEnum,
  UserRole,
  GameSetupPhase,
  GamePhase,
} from "../models/enums/CommomEnuns";

const db = getFirestore();

const TOTAL_PLAYER_SKILLS = 12;
const TOTAL_GM_SKILLS = 4;
const TOTAL_SKILLS_OVERALL = TOTAL_PLAYER_SKILLS + TOTAL_GM_SKILLS;

// --- Existing User and Server Management Functions ---
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
    gamePhase: GamePhase.LOBBY,
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

    if (serverData.gamePhase !== GamePhase.LOBBY) {
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
      avatarUrl:
        currentUser.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          currentUser.displayName || currentUser.email?.split("@")[0] || "P"
        )}&background=random&size=100`,
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

// --- Game Setup Flow Functions ---
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
      worldTruths: [],
      currentPlayerTruthIndex: 0,
      characterConcepts: playersInLobby.map((p) => ({
        playerId: p.userId,
        playerName: p.playerName,
        concept: "",
        submitted: false,
      })),
      allConceptsSubmitted: false,
      skillRolls: [],
      allSkillRollsSubmitted: false,
      skillsPerPlayerAllocation: {},
      currentPlayerSkillDefOrderIndex: 0,
      definedSkills: [],
      gmSkillsDefinedCount: 0,
      playerSkillModifiers: {},
      playerModifierSelectionStatus: {},
    };

    await updateDoc(serverDocRef, {
      gamePhase: GamePhase.SETUP,
      gameSetup: initialGameSetup,
      lastActivityAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error starting game and initializing setup:", error);
    return false;
  }
};

export const listenToServerStatusAndPhase = (
  serverId: string,
  onUpdate: (
    status: GameServerStatus,
    gamePhase: GamePhase | undefined,
    gameSetup: GameSetupState | undefined,
    gameplay: GameplayState | undefined
  ) => void
): Unsubscribe => {
  const serverDocRef = doc(db, "gameServers", serverId);
  return onSnapshot(serverDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverData = docSnap.data() as GameServer;
      onUpdate(
        serverData.status || "lobby",
        serverData.gamePhase,
        serverData.gameSetup ?? undefined,
        serverData.gameplay
      );
    } else {
      onUpdate("lobby", undefined, undefined, undefined);
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
      onGameSetupUpdate(serverData.gameSetup ?? undefined);
    } else {
      onGameSetupUpdate(undefined);
    }
  });
};

export const listenToGameplayState = (
  serverId: string,
  onGameplayUpdate: (gameplay?: GameplayState) => void
): Unsubscribe => {
  const serverDocRef = doc(db, "gameServers", serverId);
  return onSnapshot(serverDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverData = docSnap.data() as GameServer;
      onGameplayUpdate(serverData.gameplay);
    } else {
      onGameplayUpdate(undefined);
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
      interferenceTokens[definitionOrderFromRolls[i]] =
        (interferenceTokens[definitionOrderFromRolls[i]] || 0) + 1;
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
    rolledAt: new Date(),
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
      updatedRolls[existingRollIndex] = playerRollData;
    } else {
      updatedRolls.push(playerRollData);
    }

    const updatePayload: any = {
      "gameSetup.playerRolls": updatedRolls,
      lastActivityAt: serverTimestamp(),
    };

    await updateDoc(serverDocRef, updatePayload);

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

    let nextPhase: GameSetupPhase = gameSetup.currentPhase;
    let nextPlayerIdToDefine: string | null = null;

    const numPlayers = gameSetup.numPlayersAtSetupStart;
    const currentDefinitionOrder = gameSetup.definitionOrder;

    const updatedWorldDefinition = {
      ...gameSetup.worldDefinition,
      ...worldDefinitionUpdate,
    };
    const updatePayload: any = {
      "gameSetup.worldDefinition": updatedWorldDefinition,
      lastActivityAt: serverTimestamp(),
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
        nextPlayerIdToDefine = currentDefinitionOrder[0]; // 1st player defines genre and location
      else
        nextPlayerIdToDefine =
          currentDefinitionOrder[2 % currentDefinitionOrder.length];
    } else if (definitionType === "location") {
      nextPhase = GameSetupPhase.DEFINING_TRUTHS;
      nextPlayerIdToDefine = currentDefinitionOrder[0]; // First player in order starts defining truths
      updatePayload["gameSetup.worldTruths"] = [];
      updatePayload["gameSetup.currentPlayerTruthIndex"] = 0;
    }

    updatePayload["gameSetup.currentPhase"] = nextPhase;
    updatePayload["gameSetup.currentPlayerIdToDefine"] = nextPlayerIdToDefine;

    await updateDoc(serverDocRef, updatePayload);
  } catch (error) {
    console.error("Error submitting world definition part:", error);
    throw new Error("Falha ao submeter definição.");
  }
};

export const submitWorldTruth = async (
  serverId: string,
  playerId: string,
  playerName: string,
  truthText: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_TRUTHS ||
      !gameSetup.definitionOrder
    ) {
      throw new Error(
        "Não é a fase de definir verdades ou a ordem de definição não está pronta."
      );
    }
    if (gameSetup.currentPlayerIdToDefine !== playerId) {
      throw new Error("Não é sua vez de definir uma verdade.");
    }

    const currentTruths = gameSetup.worldTruths || [];
    const newTruth: WorldTruth = {
      truth: truthText,
      definedByPlayerId: playerId,
      definedByPlayerName: playerName,
      order: currentTruths.length + 1,
    };

    const updatedTruths = [...currentTruths, newTruth];
    let nextPhase: GameSetupPhase = GameSetupPhase.DEFINING_TRUTHS;
    let nextPlayerIdToDefine: string | null = null;
    let nextPlayerTruthIndex = (gameSetup.currentPlayerTruthIndex ?? -1) + 1;

    if (nextPlayerTruthIndex >= gameSetup.definitionOrder.length) {
      nextPhase = GameSetupPhase.DEFINING_CHARACTER_CONCEPTS;
      nextPlayerIdToDefine = null; // All players submit concepts concurrently
      nextPlayerTruthIndex = 0; // Reset for potential future use or just clear

      const initialCharacterConcepts: PlayerConceptEntry[] =
        gameSetup.definitionOrder.map((pid) => {
          const player = serverData.players.find((p) => p.userId === pid);
          return {
            playerId: pid,
            playerName: player?.playerName || "Jogador Desconhecido",
            concept: "",
            submitted: false,
          };
        });

      await updateDoc(serverDocRef, {
        "gameSetup.worldTruths": updatedTruths,
        "gameSetup.currentPhase": nextPhase,
        "gameSetup.currentPlayerIdToDefine": nextPlayerIdToDefine,
        "gameSetup.currentPlayerTruthIndex": nextPlayerTruthIndex,
        "gameSetup.characterConcepts": initialCharacterConcepts,
        "gameSetup.allConceptsSubmitted": false,
        "gameSetup.skillRolls": [],
        "gameSetup.allSkillRollsSubmitted": false,
        "gameSetup.definedSkills": [],
        "gameSetup.skillsPerPlayerAllocation": {},
        "gameSetup.gmSkillsDefinedCount": 0,
        lastActivityAt: serverTimestamp(),
      });
    } else {
      nextPlayerIdToDefine = gameSetup.definitionOrder[nextPlayerTruthIndex];
      await updateDoc(serverDocRef, {
        "gameSetup.worldTruths": updatedTruths,
        "gameSetup.currentPhase": nextPhase,
        "gameSetup.currentPlayerIdToDefine": nextPlayerIdToDefine,
        "gameSetup.currentPlayerTruthIndex": nextPlayerTruthIndex,
        lastActivityAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error submitting world truth:", error);
    throw error;
  }
};

export const submitCharacterConcept = async (
  serverId: string,
  playerId: string,
  concept: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_CHARACTER_CONCEPTS ||
      !gameSetup.characterConcepts
    ) {
      throw new Error(
        "Fase incorreta ou conceitos de personagem não inicializados."
      );
    }

    const conceptIndex = gameSetup.characterConcepts.findIndex(
      (c) => c.playerId === playerId
    );
    if (conceptIndex === -1) {
      throw new Error("Jogador não encontrado na lista de conceitos.");
    }
    // Prevent re-submission if already submitted
    if (gameSetup.characterConcepts[conceptIndex].submitted) {
      console.log(
        `Player ${playerId} already submitted their character concept.`
      );
      return;
    }

    const updatedConcepts = [...gameSetup.characterConcepts];
    updatedConcepts[conceptIndex] = {
      ...updatedConcepts[conceptIndex],
      concept,
      submitted: true,
    };

    const allSubmitted = updatedConcepts.every((c) => c.submitted);
    const updatePayload: any = {
      "gameSetup.characterConcepts": updatedConcepts,
      lastActivityAt: serverTimestamp(),
    };

    if (allSubmitted) {
      updatePayload["gameSetup.allConceptsSubmitted"] = true;
      updatePayload["gameSetup.currentPhase"] = GameSetupPhase.SKILL_DICE_ROLL;
      updatePayload["gameSetup.skillRolls"] = []; // Initialize for next phase
      updatePayload["gameSetup.allSkillRollsSubmitted"] = false;
      updatePayload["gameSetup.currentPlayerIdToDefine"] = null; // Reset, as all players roll
    }
    await updateDoc(serverDocRef, updatePayload);
  } catch (error) {
    console.error("Error submitting character concept:", error);
    throw error;
  }
};

export const submitSkillRoll = async (
  serverId: string,
  playerId: string,
  playerName: string,
  rollValue: number
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.SKILL_DICE_ROLL ||
      !gameSetup.skillRolls // Ensure skillRolls array exists
    ) {
      throw new Error(
        "Fase incorreta ou rolagens de habilidade não inicializadas."
      );
    }

    const existingRoll = gameSetup.skillRolls.find(
      (r) => r.playerId === playerId
    );
    if (existingRoll) {
      console.log(`Player ${playerId} already submitted skill roll.`);
      return;
    }

    const newRoll: PlayerRoll = {
      playerId,
      playerName,
      rollValue,
      rolledAt: new Date(),
    };
    const updatedSkillRolls = [...gameSetup.skillRolls, newRoll];

    const allRolled =
      updatedSkillRolls.length === gameSetup.numPlayersAtSetupStart;
    const updatePayload: any = {
      "gameSetup.skillRolls": updatedSkillRolls,
      lastActivityAt: serverTimestamp(),
    };

    if (allRolled) {
      const sortedSkillRolls = [...updatedSkillRolls].sort((a, b) => {
        if (b.rollValue !== a.rollValue) return b.rollValue - a.rollValue;
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

      updatePayload["gameSetup.skillRolls"] = sortedSkillRolls; // Store sorted rolls
      updatePayload["gameSetup.allSkillRollsSubmitted"] = true;
      updatePayload["gameSetup.currentPhase"] =
        GameSetupPhase.DEFINING_PLAYER_SKILLS;

      const skillsPerPlayerBase = Math.floor(
        TOTAL_PLAYER_SKILLS / gameSetup.numPlayersAtSetupStart
      );
      let remainingSkills =
        TOTAL_PLAYER_SKILLS % gameSetup.numPlayersAtSetupStart;
      const skillsAllocation: { [pid: string]: PlayerSkillAllocation } = {};

      sortedSkillRolls.forEach((roll) => {
        let totalToDefine = skillsPerPlayerBase;
        if (remainingSkills > 0) {
          totalToDefine++;
          remainingSkills--;
        }
        skillsAllocation[roll.playerId] = {
          totalToDefine,
          definedCount: 0,
          finalized: false,
        };
      });

      updatePayload["gameSetup.skillsPerPlayerAllocation"] = skillsAllocation;
      updatePayload["gameSetup.currentPlayerSkillDefOrderIndex"] = 0; // Start with the first player in sorted order
      updatePayload["gameSetup.currentPlayerIdToDefine"] =
        sortedSkillRolls[0]?.playerId || null;
      updatePayload["gameSetup.definedSkills"] = gameSetup.definedSkills || []; // Ensure it's initialized
    }
    await updateDoc(serverDocRef, updatePayload);
  } catch (error) {
    console.error("Error submitting skill roll:", error);
    throw error;
  }
};

export const addPlayerSkill = async (
  serverId: string,
  playerId: string,
  playerName: string,
  skillName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_PLAYER_SKILLS ||
      !gameSetup.skillsPerPlayerAllocation ||
      !gameSetup.definedSkills
    ) {
      throw new Error(
        "Fase incorreta ou dados de configuração de habilidades ausentes."
      );
    }
    if (gameSetup.currentPlayerIdToDefine !== playerId) {
      throw new Error("Não é sua vez de definir uma habilidade.");
    }

    const playerAllocation = gameSetup.skillsPerPlayerAllocation[playerId];
    if (!playerAllocation)
      throw new Error("Alocação de habilidades não encontrada para o jogador.");
    if (playerAllocation.finalized)
      throw new Error("Você já finalizou suas escolhas de habilidades.");
    if (playerAllocation.definedCount >= playerAllocation.totalToDefine) {
      throw new Error("Você já definiu todas as suas habilidades alocadas.");
    }
    if (
      gameSetup.definedSkills.some(
        (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
      )
    ) {
      throw new Error("Esta habilidade já foi escolhida. Escolha outra.");
    }

    const newSkill: DefinedSkill = {
      skillName,
      definedByPlayerId: playerId,
      definedByPlayerName: playerName,
      type: "player",
    };

    await updateDoc(serverDocRef, {
      "gameSetup.definedSkills": arrayUnion(newSkill),
      [`gameSetup.skillsPerPlayerAllocation.${playerId}.definedCount`]:
        playerAllocation.definedCount + 1,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding player skill:", error);
    throw error;
  }
};

export const removePlayerSkill = async (
  serverId: string,
  playerId: string,
  skillName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_PLAYER_SKILLS ||
      !gameSetup.skillsPerPlayerAllocation ||
      !gameSetup.definedSkills
    ) {
      throw new Error(
        "Fase incorreta ou dados de configuração de habilidades ausentes."
      );
    }
    if (gameSetup.currentPlayerIdToDefine !== playerId) {
      // Though technically only the current player should be able to add/remove from their list
      throw new Error("Não é sua vez de remover uma habilidade.");
    }
    const playerAllocation = gameSetup.skillsPerPlayerAllocation[playerId];
    if (!playerAllocation || playerAllocation.finalized) {
      throw new Error(
        "Não é possível remover habilidades após finalizar ou alocação não encontrada."
      );
    }

    const skillToRemove = gameSetup.definedSkills.find(
      (s) =>
        s.skillName.toLowerCase() === skillName.toLowerCase() &&
        s.definedByPlayerId === playerId &&
        s.type === "player"
    );

    if (!skillToRemove) {
      throw new Error(
        "Habilidade não encontrada ou não definida por você para remover."
      );
    }

    await updateDoc(serverDocRef, {
      "gameSetup.definedSkills": arrayRemove(skillToRemove),
      [`gameSetup.skillsPerPlayerAllocation.${playerId}.definedCount`]:
        playerAllocation.definedCount - 1,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error removing player skill:", error);
    throw error;
  }
};

export const finalizePlayerSkills = async (
  serverId: string,
  playerId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    let gameSetup = serverData.gameSetup; // Use let if you might reassign it (though it's better to create a new object for updates)

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_PLAYER_SKILLS ||
      !gameSetup.skillsPerPlayerAllocation ||
      !gameSetup.skillRolls // skillRolls is needed to determine the next player
    ) {
      throw new Error(
        "Fase incorreta ou dados de configuração de habilidades ausentes."
      );
    }
    if (gameSetup.currentPlayerIdToDefine !== playerId) {
      throw new Error("Não é sua vez de finalizar habilidades.");
    }
    const playerAllocation = gameSetup.skillsPerPlayerAllocation[playerId];
    if (!playerAllocation) throw new Error("Alocação não encontrada.");
    if (playerAllocation.definedCount < playerAllocation.totalToDefine) {
      throw new Error(
        `Você ainda precisa definir ${playerAllocation.totalToDefine - playerAllocation.definedCount} habilidade(s).`
      );
    }

    const updatedAllocation = {
      ...gameSetup.skillsPerPlayerAllocation,
      [playerId]: { ...playerAllocation, finalized: true },
    };

    let nextPlayerSkillDefOrderIndex =
      (gameSetup.currentPlayerSkillDefOrderIndex ?? -1) + 1;
    let nextPhase: GameSetupPhase = gameSetup.currentPhase; // Explicitly type nextPhase
    let nextPlayerIdToDefine: string | null = null;

    if (nextPlayerSkillDefOrderIndex >= gameSetup.skillRolls.length) {
      // All players finished their turns for defining skills
      nextPhase = GameSetupPhase.DEFINING_GM_SKILLS;
      nextPlayerIdToDefine = serverData.gmId;
      nextPlayerSkillDefOrderIndex = 0; // Reset for GM or clear
    } else {
      nextPlayerIdToDefine =
        gameSetup.skillRolls[nextPlayerSkillDefOrderIndex].playerId;
    }

    await updateDoc(serverDocRef, {
      "gameSetup.skillsPerPlayerAllocation": updatedAllocation,
      "gameSetup.currentPhase": nextPhase,
      "gameSetup.currentPlayerIdToDefine": nextPlayerIdToDefine,
      "gameSetup.currentPlayerSkillDefOrderIndex": nextPlayerSkillDefOrderIndex,
      "gameSetup.gmSkillsDefinedCount":
        nextPhase === GameSetupPhase.DEFINING_GM_SKILLS
          ? 0
          : gameSetup.gmSkillsDefinedCount,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error finalizing player skills:", error);
    throw error;
  }
};

export const addGmSkill = async (
  serverId: string,
  gmId: string,
  gmName: string,
  skillName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_GM_SKILLS ||
      !gameSetup.definedSkills // Ensure definedSkills array exists
    ) {
      throw new Error(
        "Fase incorreta ou dados de configuração de habilidades ausentes."
      );
    }
    if (serverData.gmId !== gmId)
      throw new Error("Apenas o GM pode adicionar estas habilidades.");
    if ((gameSetup.gmSkillsDefinedCount || 0) >= TOTAL_GM_SKILLS) {
      throw new Error(
        `O GM já definiu todas as ${TOTAL_GM_SKILLS} habilidades.`
      );
    }
    if (
      gameSetup.definedSkills.some(
        (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
      )
    ) {
      throw new Error("Esta habilidade já foi escolhida. Escolha outra.");
    }

    const newSkill: DefinedSkill = {
      skillName,
      definedByPlayerId: gmId,
      definedByPlayerName: gmName,
      type: "gm",
    };

    await updateDoc(serverDocRef, {
      "gameSetup.definedSkills": arrayUnion(newSkill),
      "gameSetup.gmSkillsDefinedCount":
        (gameSetup.gmSkillsDefinedCount || 0) + 1,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding GM skill:", error);
    throw error;
  }
};

export const finalizeGmSkills = async (
  serverId: string,
  gmId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_GM_SKILLS
    ) {
      throw new Error("Fase incorreta.");
    }
    if (serverData.gmId !== gmId)
      throw new Error("Apenas o GM pode finalizar as habilidades.");
    if ((gameSetup.gmSkillsDefinedCount || 0) < TOTAL_GM_SKILLS) {
      throw new Error(
        `O GM ainda precisa definir ${TOTAL_GM_SKILLS - (gameSetup.gmSkillsDefinedCount || 0)} habilidade(s).`
      );
    }

    const playerSkillModifiers: {
      [playerId: string]: PlayerSkillModifierChoice[];
    } = {};
    const playerModifierSelectionStatus: {
      [playerId: string]: PlayerModifierSelectionStatus;
    } = {};

    serverData.players.forEach((player) => {
      playerSkillModifiers[player.userId] = [];
      playerModifierSelectionStatus[player.userId] = {
        assignedModifiers: [],
        finalized: false,
      };
    });

    await updateDoc(serverDocRef, {
      "gameSetup.currentPhase": GameSetupPhase.ASSIGNING_SKILL_MODIFIERS,
      "gameSetup.currentPlayerIdToDefine": null, // All players assign concurrently
      "gameSetup.playerSkillModifiers": playerSkillModifiers,
      "gameSetup.playerModifierSelectionStatus": playerModifierSelectionStatus,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error finalizing GM skills:", error);
    throw error;
  }
};

export const assignPlayerSkillModifier = async (
  serverId: string,
  playerId: string,
  skillName: string,
  modifierValue: number
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.ASSIGNING_SKILL_MODIFIERS ||
      !gameSetup.playerSkillModifiers ||
      !gameSetup.playerModifierSelectionStatus ||
      !gameSetup.definedSkills
    ) {
      throw new Error(
        "Fase incorreta ou dados de configuração de modificadores ausentes."
      );
    }

    const playerStatus = gameSetup.playerModifierSelectionStatus[playerId];
    if (!playerStatus)
      throw new Error(
        "Status de seleção de modificador do jogador não encontrado."
      );
    if (playerStatus.finalized)
      throw new Error("Você já finalizou a atribuição de modificadores.");

    if (![-2, -1, 1, 2].includes(modifierValue)) {
      throw new Error("Valor de modificador inválido.");
    }
    if (!gameSetup.definedSkills.some((s) => s.skillName === skillName)) {
      throw new Error("Habilidade selecionada não existe na lista final.");
    }

    let currentModifiers = gameSetup.playerSkillModifiers[playerId] || [];
    // Remove any existing assignment for this MODIFIER VALUE (a modifier can only be used once)
    currentModifiers = currentModifiers.filter(
      (m) => m.modifierValue !== modifierValue
    );
    // Remove any existing assignment for this SKILL (a skill can only have one modifier)
    currentModifiers = currentModifiers.filter(
      (m) => m.skillName !== skillName
    );

    // Add the new assignment
    currentModifiers.push({ skillName, modifierValue });

    const assignedValues = currentModifiers.map((m) => m.modifierValue);

    await updateDoc(serverDocRef, {
      [`gameSetup.playerSkillModifiers.${playerId}`]: currentModifiers,
      [`gameSetup.playerModifierSelectionStatus.${playerId}.assignedModifiers`]:
        assignedValues,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error assigning player skill modifier:", error);
    throw error;
  }
};

export const finalizePlayerSkillModifiers = async (
  serverId: string,
  playerId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;
    const gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.ASSIGNING_SKILL_MODIFIERS ||
      !gameSetup.playerModifierSelectionStatus
    ) {
      throw new Error(
        "Fase incorreta ou status de seleção de modificador ausente."
      );
    }

    const playerStatus = gameSetup.playerModifierSelectionStatus[playerId];
    if (!playerStatus)
      throw new Error(
        "Status de seleção de modificador do jogador não encontrado."
      );
    if (playerStatus.assignedModifiers.length !== 4) {
      throw new Error(
        "Você deve atribuir todos os 4 modificadores (+2, +1, -1, -2) antes de finalizar."
      );
    }

    const updatedStatus = {
      ...gameSetup.playerModifierSelectionStatus,
      [playerId]: { ...playerStatus, finalized: true },
    };
    const allPlayersFinalized = Object.values(updatedStatus).every(
      (status) => status.finalized
    );

    let nextPhase: GameSetupPhase = gameSetup.currentPhase;
    if (allPlayersFinalized) {
      nextPhase = GameSetupPhase.AWAITING_GAME_START;
    }

    // Explicitly widen the type of gameSetup before spreading
    const unNarrowedGameSetup: GameSetupState = gameSetup;
    const newGameSetupState: GameSetupState = {
      ...unNarrowedGameSetup,
      playerModifierSelectionStatus: updatedStatus,
      currentPhase: nextPhase,
    };

    await updateDoc(serverDocRef, {
      gameSetup: newGameSetupState,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error finalizing player skill modifiers:", error);
    throw error;
  }
};

// --- Gameplay Functions ---
export const initiateGameplaySession = async (
  serverId: string,
  gmId: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists())
      throw new Error("Servidor não encontrado para iniciar o jogo.");
    const serverData = serverSnap.data() as GameServer;

    if (serverData.gmId !== gmId) {
      throw new Error("Apenas o Mestre pode iniciar a sessão de jogo.");
    }
    if (
      !serverData.gameSetup ||
      serverData.gameSetup.currentPhase !== GameSetupPhase.AWAITING_GAME_START
    ) {
      throw new Error(
        "A configuração do jogo ainda não foi concluída por todos."
      );
    }
    if (
      !serverData.gameSetup.playerModifierSelectionStatus ||
      !serverData.players.every(
        (p) =>
          serverData.gameSetup!.playerModifierSelectionStatus![p.userId]
            ?.finalized
      )
    ) {
      throw new Error(
        "Nem todos os jogadores finalizaram a atribuição de modificadores."
      );
    }

    const initialGameplayState: GameplayState = {
      playerStates: {},
      gameLog: [],
      currentTurnPlayerId: null,
    };

    const characterConcepts = serverData.gameSetup.characterConcepts || [];
    const playerSkillModifiers =
      serverData.gameSetup.playerSkillModifiers || {};
    const interferenceTokensSetup =
      serverData.gameSetup.interferenceTokens || {};

    serverData.players.forEach((player) => {
      const concept = characterConcepts.find(
        (c) => c.playerId === player.userId
      );
      const skills = playerSkillModifiers[player.userId] || [];

      initialGameplayState.playerStates[player.userId] = {
        userId: player.userId,
        characterName: concept?.concept || player.playerName,
        avatarUrl: player.avatarUrl ?? undefined,
        maxHp: 10,
        currentHp: 10,
        assignedSkills: skills,
        interferenceTokens: interferenceTokensSetup[player.userId] || 0, // Initialize interference tokens
      };
    });

    initialGameplayState.gameLog.push({
      id: `${Date.now()}-systemStart`,
      timestamp: Timestamp.now(), // Use client-generated Firestore Timestamp
      type: "system",
      message: "A sessão de jogo foi iniciada pelo Mestre!",
    });

    await updateDoc(serverDocRef, {
      gamePhase: GamePhase.ACTIVE,
      gameplay: initialGameplayState,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error initiating gameplay session:", error);
    throw error;
  }
};

export const rollSkillDiceForGameplay = async (
  serverId: string,
  playerId: string,
  playerName: string,
  skillName: string,
  modifier: number
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;

    if (!serverData.gameplay || serverData.gamePhase !== GamePhase.ACTIVE) {
      throw new Error("O jogo não está ativo para realizar esta ação.");
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = d1 + d2 + modifier;

    const logEntry: GameLogEntry = {
      id: `${Date.now()}-${playerId}-roll`,
      timestamp: Timestamp.now(), // Use client-generated Firestore Timestamp
      type: "roll",
      playerId,
      playerName,
      message: `${playerName} rolou ${skillName} (${modifier >= 0 ? "+" : ""}${modifier}) e obteve ${totalRoll}. (Dados: ${d1}, ${d2})`,
      rollDetails: {
        skillName,
        diceResult: [d1, d2],
        modifier,
        totalRoll,
      },
    };

    await updateDoc(serverDocRef, {
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error rolling skill dice for gameplay:", error);
    throw error;
  }
};

export const useInterferenceToken = async (
  serverId: string,
  playerId: string,
  playerName: string
): Promise<void> => {
  const serverDocRef = doc(db, "gameServers", serverId);
  try {
    const serverSnap = await getDoc(serverDocRef);
    if (!serverSnap.exists()) throw new Error("Servidor não encontrado.");
    const serverData = serverSnap.data() as GameServer;

    if (!serverData.gameplay || serverData.gamePhase !== GamePhase.ACTIVE) {
      throw new Error("O jogo não está ativo para usar um token.");
    }

    const playerState = serverData.gameplay.playerStates[playerId];
    if (!playerState) throw new Error("Estado do jogador não encontrado.");

    if (playerState.interferenceTokens <= 0) {
      throw new Error("Você não tem tokens de interferência para usar.");
    }

    const updatedTokens = playerState.interferenceTokens - 1;

    const logEntry: GameLogEntry = {
      id: `${Date.now()}-${playerId}-token`,
      timestamp: Timestamp.now(),
      type: "token",
      playerId,
      playerName,
      message: `${playerName} usou um Token de Interferência!`,
    };

    await updateDoc(serverDocRef, {
      [`gameplay.playerStates.${playerId}.interferenceTokens`]: updatedTokens,
      "gameplay.gameLog": arrayUnion(logEntry),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error using interference token:", error);
    throw error;
  }
};
