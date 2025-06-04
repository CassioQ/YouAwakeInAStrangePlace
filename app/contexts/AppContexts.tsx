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
import {
  auth,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential, // Changed from signInWithPopup
  signOut as firebaseSignOut,
  updateProfile, // Added for updating profile after social sign-in if needed
} from "../../firebase";

// Expo Auth Session
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import { makeRedirectUri, useAuthRequestResult } from "expo-auth-session";

// Environment variables for client IDs (ensure these are in your .env and env.d.ts)
import {
  EXPO_GOOGLE_CLIENT_ID, // For Expo Go & Web
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

  // Google Auth Request
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      clientId: EXPO_GOOGLE_CLIENT_ID,
      webClientId: EXPO_GOOGLE_CLIENT_ID,
      iosClientId: IOS_GOOGLE_CLIENT_ID,
      androidClientId: ANDROID_GOOGLE_CLIENT_ID,
      //redirectUri: makeRedirectUri(), // Optional: if you need to override
    });

  // Facebook Auth Request
  const [facebookRequest, facebookResponse, promptFacebookAsync] =
    Facebook.useAuthRequest({
      clientId: FACEBOOK_APP_ID,
      //redirectUri: makeRedirectUri(), // Optional: if you need to override
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
      } else {
        if (openAccessScreens()) {
          navigateTo(ScreenEnum.HOME);
        }
      }
    });
    return () => unsubscribe();
  }, [currentScreen]); // Added currentScreen dependency

  function openAccessScreens(): boolean {
    return (
      currentScreen === ScreenEnum.LOGIN ||
      currentScreen === ScreenEnum.EMAIL_LOGIN ||
      currentScreen === ScreenEnum.EMAIL_SIGNUP
    );
  }

  // Effect to handle Google Sign-In response
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then((userCredential) => {
            // User signed in, onAuthStateChanged will handle navigation
            // You might want to update the user's profile here if needed,
            // e.g., if Firebase doesn't automatically pick up the display name
            // from the Google profile for new users.
            // However, signInWithCredential usually handles this.
          })
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
      console.log("Google login cancelled or failed:", googleResponse);
      if (
        googleResponse?.type !== "cancel" &&
        googleResponse?.type !== "dismiss"
      ) {
        Alert.alert("Erro de Login", "Falha ao autenticar com Google.");
      }
      setIsLoadingAuth(false);
    }
  }, [googleResponse]);

  // Effect to handle Facebook Sign-In response
  useEffect(() => {
    if (facebookResponse?.type === "success") {
      const { access_token } = facebookResponse.params;
      if (access_token) {
        const credential = FacebookAuthProvider.credential(access_token);
        signInWithCredential(auth, credential)
          .then((userCredential) => {
            // User signed in, onAuthStateChanged will handle navigation
          })
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
      console.log("Facebook login cancelled or failed:", facebookResponse);
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
      // The response will be handled by the useEffect hook for googleResponse
      // Returning null here as the actual user object will be set by onAuthStateChanged
      return null;
    } catch (error: any) {
      console.error("Google login prompt error:", error);
      Alert.alert(
        "Erro de Login",
        "Não foi possível iniciar o login com Google."
      );
      setIsLoadingAuth(false);
      return null;
    }
  };

  const loginWithFacebook = async (): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true);
    try {
      await promptFacebookAsync();
      // The response will be handled by the useEffect hook for facebookResponse
      return null;
    } catch (error: any) {
      console.error("Facebook login prompt error:", error);
      Alert.alert(
        "Erro de Login",
        "Não foi possível iniciar o login com Facebook."
      );
      setIsLoadingAuth(false);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserRoleState(null);
      resetCharacterInProgress();
      setCreatedCharacterState(null);
      navigateTo(ScreenEnum.LOGIN);
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
