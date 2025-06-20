import { Character, Skill } from "./Character.types";
import { ScreenEnum, UserRole } from "./enums/CommomEnuns";
import type firebase from "firebase/compat/app"; // Import compat type
import { GameServer, PlayerInLobby, GameSetupState, GameplayState } from "./GameServer.types"; // Added GameplayState
import { UserProfile } from "./UserProfile.types";

export interface AppContextType {
  currentUser: firebase.User | null; // Use compat User type
  isLoadingAuth: boolean;
  userProfile: UserProfile | null;

  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;

  currentScreen: ScreenEnum;
  navigateTo: (screen: ScreenEnum) => void;

  characterInProgress: Partial<Character>;
  updateCharacterInProgress: <K extends keyof Character>(
    key: K,
    value: Character[K] | undefined
  ) => void;
  resetCharacterInProgress: () => void;

  finalizeCharacter: () => Character | null;
  createdCharacter: Character | null;
  setCreatedCharacter: (character: Character | null) => void;

  activeServerDetails: GameServer | null;
  setActiveServerDetails: (details: GameServer | null) => void;

  activeGameSetup: GameSetupState | null;
  setActiveGameSetup: (gameSetup: GameSetupState | null) => void;
  
  gameplayState: GameplayState | null; // Added
  setGameplayState: (gameplay: GameplayState | null) => void; // Added


  // Auth functions
  loginWithGoogle: () => Promise<firebase.User | null>; // Use compat User type
  loginWithFacebook: () => Promise<firebase.User | null>; // Use compat User type
  logout: () => Promise<void>;

  // Session resumption related
  fetchUserProfile: (userId: string) => Promise<void>;
  clearUserActiveServerId: (role: UserRole) => Promise<void>;
}
