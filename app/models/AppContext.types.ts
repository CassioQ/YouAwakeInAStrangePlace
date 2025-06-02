import { Character } from "./Character.types";
import { ScreenEnum, UserRole } from "./enums/CommomEnuns";

export interface AppContextType {
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
}
