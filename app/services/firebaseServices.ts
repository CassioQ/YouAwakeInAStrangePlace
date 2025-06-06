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
} from "../models/GameServer.types";
import { UserProfile } from "../models/UserProfile.types";
import {
  ScreenEnum,
  UserRole,
  GameSetupPhase,
} from "../models/enums/CommomEnuns";

const db = getFirestore();

const TOTAL_PLAYER_SKILLS = 12; // Reduced from 16
const TOTAL_GM_SKILLS = 4;
const TOTAL_SKILLS_OVERALL = TOTAL_PLAYER_SKILLS + TOTAL_GM_SKILLS; // Now 16

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
      interferenceTokens[definitionOrderFromRolls[i]] = 1;
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
      "gameSetup.lastRollAt": serverTimestamp(),
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
        nextPlayerIdToDefine = currentDefinitionOrder[0]; // 2nd player (index 0 after 1st player) defines location
      else
        nextPlayerIdToDefine =
          currentDefinitionOrder[2 % currentDefinitionOrder.length];
    } else if (definitionType === "location") {
      nextPhase = GameSetupPhase.DEFINING_TRUTHS;
      nextPlayerIdToDefine = currentDefinitionOrder[0]; // First player in order starts truth definition
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
      nextPlayerIdToDefine = null;
      nextPlayerTruthIndex = 0;

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
      updatePayload["gameSetup.skillRolls"] = [];
      updatePayload["gameSetup.allSkillRollsSubmitted"] = false;
      updatePayload["gameSetup.currentPlayerIdToDefine"] = null; // Or first player if turns are sequential for rolls
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
      !gameSetup.skillRolls
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
      updatePayload["gameSetup.currentPlayerSkillDefOrderIndex"] = 0;
      updatePayload["gameSetup.currentPlayerIdToDefine"] =
        sortedSkillRolls[0]?.playerId || null;
      updatePayload["gameSetup.definedSkills"] = gameSetup.definedSkills || []; // Ensure it exists
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
    let gameSetup = serverData.gameSetup;

    if (
      !gameSetup ||
      gameSetup.currentPhase !== GameSetupPhase.DEFINING_PLAYER_SKILLS ||
      !gameSetup.skillsPerPlayerAllocation ||
      !gameSetup.skillRolls
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
    let nextPhase: GameSetupPhase = gameSetup.currentPhase;
    let nextPlayerIdToDefine: string | null = null;

    if (nextPlayerSkillDefOrderIndex >= gameSetup.skillRolls.length) {
      nextPhase = GameSetupPhase.DEFINING_GM_SKILLS;
      nextPlayerIdToDefine = serverData.gmId;
      nextPlayerSkillDefOrderIndex = 0;
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
      !gameSetup.definedSkills
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

    await updateDoc(serverDocRef, {
      "gameSetup.currentPhase": GameSetupPhase.AWAITING_GAME_START,
      "gameSetup.currentPlayerIdToDefine": null,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error finalizing GM skills:", error);
    throw error;
  }
};
