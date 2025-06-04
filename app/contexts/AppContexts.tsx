import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { Alert, Platform } from "react-native";
import { AppContextType } from "../models/AppContext.types";
import { Character } from "../models/Character.types";
import { ScreenEnum, UserRole } from "../models/enums/CommomEnuns";
import { GameServer, PlayerInLobby } from "../models/GameServer.types";
import {
  auth,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile,
} from "../../firebase";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  FieldValue,
} from "firebase/firestore";

// Expo Auth Session
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";

import {
  EXPO_GOOGLE_CLIENT_ID,
  IOS_GOOGLE_CLIENT_ID,
  ANDROID_GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID,
} from "@env";

import * as AuthSession from "expo-auth-session";

console.log("Redirect URI:", AuthSession.makeRedirectUri());

WebBrowser.maybeCompleteAuthSession();

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

  // GM Server Management
  const [activeServerDetails, setActiveServerDetailsState] =
    useState<GameServer | null>(null);

  const db = getFirestore();

  // Google Auth Request
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      clientId: EXPO_GOOGLE_CLIENT_ID,
      webClientId: EXPO_GOOGLE_CLIENT_ID,
      iosClientId: IOS_GOOGLE_CLIENT_ID,
      androidClientId: ANDROID_GOOGLE_CLIENT_ID,
    });

  // Facebook Auth Request
  const [facebookRequest, facebookResponse, promptFacebookAsync] =
    Facebook.useAuthRequest({
      clientId: FACEBOOK_APP_ID,
    });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (!user) {
        if (!openAccessScreens()) {
          navigateTo(ScreenEnum.LOGIN);
        }
        setUserRoleState(null);
        resetCharacterInProgress();
        setCreatedCharacterState(null);
        setActiveServerDetailsState(null); // Reset active server on logout
      } else {
        if (openAccessScreens()) {
          navigateTo(ScreenEnum.HOME);
        }
      }
    });
    return () => unsubscribe();
  }, [currentScreen]);

  function openAccessScreens(): boolean {
    return (
      currentScreen === ScreenEnum.LOGIN ||
      currentScreen === ScreenEnum.EMAIL_LOGIN ||
      currentScreen === ScreenEnum.EMAIL_SIGNUP
    );
  }

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .catch((error) => {
            console.error("Google Sign-In to Firebase error:", error);
            Alert.alert(
              "Erro de Login",
              "Não foi possível fazer login com Google via Firebase."
            );
          })
          .finally(() => setIsLoadingAuth(false));
      } else {
        Alert.alert("Erro de Login", "Token do Google não recebido.");
        setIsLoadingAuth(false);
      }
    } else if (
      googleResponse?.type === "error" ||
      googleResponse?.type === "cancel" ||
      googleResponse?.type === "dismiss"
    ) {
      if (
        googleResponse?.type !== "cancel" &&
        googleResponse?.type !== "dismiss"
      ) {
        Alert.alert("Erro de Login", "Falha ao autenticar com Google.");
      }
      setIsLoadingAuth(false);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (facebookResponse?.type === "success") {
      const { access_token } = facebookResponse.params;
      if (access_token) {
        const credential = FacebookAuthProvider.credential(access_token);
        signInWithCredential(auth, credential)
          .catch((error) => {
            console.error("Facebook Sign-In to Firebase error:", error);
            Alert.alert(
              "Erro de Login",
              "Não foi possível fazer login com Facebook via Firebase."
            );
          })
          .finally(() => setIsLoadingAuth(false));
      } else {
        Alert.alert("Erro de Login", "Token do Facebook não recebido.");
        setIsLoadingAuth(false);
      }
    } else if (
      facebookResponse?.type === "error" ||
      facebookResponse?.type === "cancel" ||
      facebookResponse?.type === "dismiss"
    ) {
      if (
        facebookResponse?.type !== "cancel" &&
        facebookResponse?.type !== "dismiss"
      ) {
        Alert.alert("Erro de Login", "Falha ao autenticar com Facebook.");
      }
      setIsLoadingAuth(false);
    }
  }, [facebookResponse]);

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true);
    try {
      await promptGoogleAsync();
      return null;
    } catch (error: any) {
      setIsLoadingAuth(false);
      return null;
    }
  };

  const loginWithFacebook = async (): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true);
    try {
      await promptFacebookAsync();
      return null;
    } catch (error: any) {
      setIsLoadingAuth(false);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    try {
      await firebaseSignOut(auth);
      // State will be cleared by onAuthStateChanged
    } catch (error: any) {
      Alert.alert(
        "Erro de Logout",
        error.message || "Não foi possível fazer logout."
      );
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
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          characterInProgress.name || "A"
        )}&background=random&size=100`,
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

  const setActiveServerDetails = useCallback((details: GameServer | null) => {
    setActiveServerDetailsState(details);
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
        activeServerDetails,
        setActiveServerDetails,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
