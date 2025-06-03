import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { Alert } from "react-native";
import { AppContextType } from "../models/AppContext.types";
import { Character } from "../models/Character.types";
import { ScreenEnum, UserRole } from "../models/enums/CommomEnuns";
import {
  auth,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "../../firebase"; // Corrected path

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialCharacterInProgress: Partial<Character> = {
  skills: [],
  items: [],
  objective: "",
  name: "",
  description: "",
  theme: "",
  genre: "",
  adjective: "",
  location: "",
  primarySkillName: "",
};

interface AppProviderProps {
  children?: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenEnum>(
    ScreenEnum.HOME
  );
  const [characterInProgress, setCharacterInProgress] = useState<
    Partial<Character>
  >(initialCharacterInProgress);
  const [createdCharacter, setCreatedCharacterState] =
    useState<Character | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (!user) {
        // If user logs out or no session, navigate to login
        navigateTo(ScreenEnum.LOGIN);
        setUserRoleState(null); // Clear role on logout
        resetCharacterInProgress();
        setCreatedCharacterState(null);
      } else {
        // If user is logged in, and they were on a login/signup screen, navigate to home
        if (
          currentScreen === ScreenEnum.LOGIN ||
          currentScreen === ScreenEnum.EMAIL_LOGIN ||
          currentScreen === ScreenEnum.EMAIL_SIGNUP
        ) {
          navigateTo(ScreenEnum.HOME);
        }
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const loginWithProvider = async (
    provider: GoogleAuthProvider | FacebookAuthProvider
  ): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true);
    try {
      const result = await signInWithPopup(auth, provider);
      setCurrentUser(result.user);
      navigateTo(ScreenEnum.HOME);
      return result.user;
    } catch (error: any) {
      Alert.alert(
        "Erro de Login",
        error.message || "Não foi possível fazer login."
      );
      console.error("Login error:", error);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    const provider = new GoogleAuthProvider();
    return loginWithProvider(provider);
  };

  const loginWithFacebook = async (): Promise<FirebaseUser | null> => {
    const provider = new FacebookAuthProvider();
    return loginWithProvider(provider);
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserRoleState(null);
      resetCharacterInProgress();
      setCreatedCharacterState(null);
      navigateTo(ScreenEnum.LOGIN); // Navigate to login screen after logout
    } catch (error: any) {
      Alert.alert(
        "Erro de Logout",
        error.message || "Não foi possível fazer logout."
      );
      console.error("Logout error:", error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const setUserRole = useCallback((role: UserRole | null) => {
    setUserRoleState(role);
  }, []);

  const navigateTo = useCallback((screen: ScreenEnum) => {
    setCurrentScreen(screen);
  }, []);

  const updateCharacterInProgress = useCallback(
    <K extends keyof Character>(key: K, value: Character[K] | undefined) => {
      setCharacterInProgress((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetCharacterInProgress = useCallback(() => {
    setCharacterInProgress(initialCharacterInProgress);
  }, []);

  const finalizeCharacter = useCallback((): Character | null => {
    if (!characterInProgress.name || !characterInProgress.primarySkillName) {
      Alert.alert(
        "Erro na Criação",
        "Nome do Personagem e Habilidade Principal são obrigatórios para finalizar."
      );
      return null;
    }
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: characterInProgress.name || "Unnamed Character",
      description: characterInProgress.description || "No description.",
      playerName:
        characterInProgress.playerName ||
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        "@jogador",
      theme: characterInProgress.theme,
      genre: characterInProgress.genre,
      adjective: characterInProgress.adjective,
      location: characterInProgress.location,
      primarySkillName: characterInProgress.primarySkillName,
      avatarUrl:
        currentUser?.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(characterInProgress.name || "A")}&background=random&size=100`,
      themeImageURL:
        characterInProgress.themeImageURL ||
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3liZXJwdW5rfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
      skills:
        characterInProgress.skills && characterInProgress.skills.length > 0
          ? characterInProgress.skills
          : [
              {
                id: "s1",
                name: characterInProgress.primarySkillName || "Generic Skill",
                modifier: Math.floor(Math.random() * 6) - 2,
              },
              {
                id: "s2",
                name: "Percepção",
                modifier: Math.floor(Math.random() * 4) - 1,
              },
              {
                id: "s3",
                name: "Furtividade",
                modifier: Math.floor(Math.random() * 4) - 1,
              },
              {
                id: "s4",
                name: "Resistência",
                modifier: Math.floor(Math.random() * 3),
              },
              {
                id: "s5",
                name: "Carisma",
                modifier: Math.floor(Math.random() * 3) - 2,
              },
            ],
      items: characterInProgress.items || [],
      objective:
        characterInProgress.objective || "Descobrir os segredos deste lugar.",
    };
    setCreatedCharacterState(newCharacter);
    return newCharacter;
  }, [characterInProgress, currentUser]);

  const setCreatedCharacter = useCallback((character: Character | null) => {
    setCreatedCharacterState(character);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoadingAuth,
        userRole,
        setUserRole,
        currentScreen,
        navigateTo,
        characterInProgress,
        updateCharacterInProgress,
        resetCharacterInProgress,
        finalizeCharacter,
        createdCharacter,
        setCreatedCharacter,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
