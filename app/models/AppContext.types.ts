import { Character, Skill } from "./Character.types";
import { ScreenEnum, UserRole } from "./enums/CommomEnuns";
import { User as FirebaseUser } from "firebase/auth";
import { GameServer, PlayerInLobby } from "./GameServer.types";

export interface AppContextType {
  currentUser: FirebaseUser | null;
  isLoadingAuth: boolean;

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

  // Auth functions
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  loginWithFacebook: () => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
}
