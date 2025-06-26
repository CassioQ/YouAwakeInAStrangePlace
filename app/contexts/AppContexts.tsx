import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { AppContextType } from "../models/AppContext.types";
import { Character } from "../models/Character.types";
import { ScreenEnum, UserRole, GamePhase } from "../models/enums/CommomEnuns";
import {
  GameServer,
  GameSetupState,
  GameplayState,
} from "../models/GameServer.types";
import { UserProfile } from "../models/UserProfile.types";

import firebase from "firebase/compat/app"; // Import for FieldValue and Timestamp
import "firebase/compat/firestore"; // Ensure firebase.firestore namespace is available

import {
  auth,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  db, // Use the compat db instance from firebase.ts
} from "../../firebase";

import {
  fetchUserProfileData,
  updateUserActiveServerId as fbUpdateUserActiveServerId,
} from "../services/userProfileServices";
import { listenToServerStatusAndPhase } from "../services/gameSetupServices";
import { showAppAlert } from "../utils/alertUtils";
import { Unsubscribe } from "firebase/firestore"; // This type ( () => void ) is compatible

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

console.log("Redirect URI for AuthSession:", AuthSession.makeRedirectUri());

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
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenEnum>(
    ScreenEnum.LOGIN
  );
  const [characterInProgress, setCharacterInProgress] = useState<
    Partial<Character>
  >(initialCharacterInProgress);
  const [createdCharacter, setCreatedCharacterState] =
    useState<Character | null>(null);

  const [activeServerDetails, setActiveServerDetailsState] =
    useState<GameServer | null>(null);
  const [activeGameSetup, setActiveGameSetupState] =
    useState<GameSetupState | null>(null);
  const [gameplayState, setGameplayState] = useState<GameplayState | null>(
    null
  );
  const [serverListenerUnsubscribe, setServerListenerUnsubscribe] =
    useState<Unsubscribe | null>(null);

  // db is now imported from firebase.ts

  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      clientId: EXPO_GOOGLE_CLIENT_ID,
      webClientId: EXPO_GOOGLE_CLIENT_ID,
      iosClientId: IOS_GOOGLE_CLIENT_ID,
      androidClientId: ANDROID_GOOGLE_CLIENT_ID,
    });

  const [facebookRequest, facebookResponse, promptFacebookAsync] =
    Facebook.useAuthRequest({
      clientId: FACEBOOK_APP_ID,
    });

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await fetchUserProfileData(userId);
      setUserProfileState(profile);
    } catch (error) {
      console.error("Error fetching user profile in context:", error);
      setUserProfileState(null);
    }
  }, []);

  const navigateTo = useCallback((screen: ScreenEnum) => {
    setCurrentScreen(screen);
  }, []);

  const resetCharacterInProgress = useCallback(() => {
    setCharacterInProgress(initialCharacterInProgress);
  }, []);

  const clearUserActiveServerId = useCallback(
    async (role: UserRole) => {
      if (currentUser) {
        try {
          await fbUpdateUserActiveServerId(currentUser.uid, role, null);
          setUserProfileState((prev) =>
            prev
              ? {
                  ...prev,
                  ...(role === UserRole.GM && { activeGmServerId: null }),
                  ...(role === UserRole.PLAYER && {
                    activePlayerServerId: null,
                  }),
                }
              : null
          );
        } catch (error) {
          console.error("Error clearing user active server ID:", error);
        }
      }
    },
    [currentUser]
  );

  // Effect for Firebase Auth State changes
  useEffect(() => {
    setIsLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(
      async (user: FirebaseUser | null) => {
        setCurrentUser(user);
        if (user) {
          await fetchUserProfile(user.uid);
          // Use compat db instance and methods
          const userProfileRef = db.collection("userProfiles").doc(user.uid);
          try {
            await userProfileRef.set(
              {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName,
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          } catch (e) {
            console.error(
              "Error setting user profile doc in onAuthStateChanged:",
              e
            );
          }
        } else {
          setUserProfileState(null);
          setUserRoleState(null);
          resetCharacterInProgress();
          setCreatedCharacterState(null);
          setActiveServerDetailsState(null);
          setActiveGameSetupState(null);
          setGameplayState(null);
        }
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, [fetchUserProfile, resetCharacterInProgress]);

  // Effect for navigation based on auth state and current screen
  useEffect(() => {
    if (isLoadingAuth) return;

    if (currentUser) {
      if (
        currentScreen === ScreenEnum.LOGIN ||
        currentScreen === ScreenEnum.EMAIL_LOGIN ||
        currentScreen === ScreenEnum.EMAIL_SIGNUP
      ) {
        navigateTo(ScreenEnum.HOME);
      }
    } else {
      if (
        currentScreen !== ScreenEnum.LOGIN &&
        currentScreen !== ScreenEnum.EMAIL_LOGIN &&
        currentScreen !== ScreenEnum.EMAIL_SIGNUP
      ) {
        navigateTo(ScreenEnum.LOGIN);
      }
    }
  }, [currentUser, isLoadingAuth, currentScreen, navigateTo]);

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(credential)
          .catch((error) => {
            console.error("Google Sign-In to Firebase error:", error);
            showAppAlert(
              "Erro de Login",
              "Não foi possível fazer login com Google via Firebase."
            );
          })
          .finally(() => setIsLoadingAuth(false));
      } else {
        showAppAlert("Erro de Login", "Token do Google não recebido.");
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
        showAppAlert("Erro de Login", "Falha ao autenticar com Google.");
      }
      setIsLoadingAuth(false);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (facebookResponse?.type === "success") {
      const { access_token } = facebookResponse.params;
      if (access_token) {
        const credential = FacebookAuthProvider.credential(access_token);
        signInWithCredential(credential)
          .catch((error) => {
            console.error("Facebook Sign-In to Firebase error:", error);
            showAppAlert(
              "Erro de Login",
              "Não foi possível fazer login com Facebook via Firebase."
            );
          })
          .finally(() => setIsLoadingAuth(false));
      } else {
        showAppAlert("Erro de Login", "Token do Facebook não recebido.");
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
        showAppAlert("Erro de Login", "Falha ao autenticar com Facebook.");
      }
      setIsLoadingAuth(false);
    }
  }, [facebookResponse]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    if (activeServerDetails?.id && currentUser) {
      unsubscribe = listenToServerStatusAndPhase(
        activeServerDetails.id,
        (status, gamePhase, gameSetupData, gameplayData) => {
          setActiveServerDetailsState((prev) => {
            if (!prev) return null;
            if (
              prev.status === status &&
              prev.gamePhase === gamePhase &&
              prev.gameSetup === gameSetupData &&
              prev.gameplay === gameplayData
            ) {
              return prev;
            }
            return {
              ...prev,
              status,
              gamePhase: gamePhase || prev.gamePhase,
              gameSetup: gameSetupData || prev.gameSetup,
              gameplay: gameplayData || prev.gameplay,
            };
          });
          setActiveGameSetupState(gameSetupData || null);
          setGameplayState(gameplayData || null);

          if (gamePhase === GamePhase.ACTIVE) {
            if (
              userRole === UserRole.GM &&
              currentScreen !== ScreenEnum.GM_GAMEPLAY
            ) {
              navigateTo(ScreenEnum.GM_GAMEPLAY);
            } else if (
              userRole === UserRole.PLAYER &&
              currentScreen !== ScreenEnum.PLAYER_GAMEPLAY
            ) {
              navigateTo(ScreenEnum.PLAYER_GAMEPLAY);
            }
          } else if (gamePhase === GamePhase.SETUP && gameSetupData) {
            if (
              userRole === UserRole.GM &&
              currentScreen !== ScreenEnum.GAME_SETUP_GM_MONITOR
            ) {
              navigateTo(ScreenEnum.GAME_SETUP_GM_MONITOR);
            } else if (
              userRole === UserRole.PLAYER &&
              currentScreen !== ScreenEnum.GAME_SETUP_PLAYER
            ) {
              navigateTo(ScreenEnum.GAME_SETUP_PLAYER);
            }
          } else if (gamePhase === GamePhase.LOBBY) {
            if (
              userRole === UserRole.GM &&
              currentScreen !== ScreenEnum.GM_LOBBY
            ) {
              navigateTo(ScreenEnum.GM_LOBBY);
            } else if (
              userRole === UserRole.PLAYER &&
              currentScreen !== ScreenEnum.PLAYER_LOBBY
            ) {
              navigateTo(ScreenEnum.PLAYER_LOBBY);
            }
          } else if (gamePhase === GamePhase.ENDED) {
            showAppAlert(
              "Partida Finalizada",
              "A sessão de jogo foi encerrada."
            );
            if (currentUser)
              clearUserActiveServerId(userRole || UserRole.PLAYER);
            navigateTo(ScreenEnum.HOME);
          }
        }
      );
      setServerListenerUnsubscribe(() => unsubscribe);
    } else {
      if (serverListenerUnsubscribe) {
        serverListenerUnsubscribe();
        setServerListenerUnsubscribe(null);
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (
        serverListenerUnsubscribe &&
        !activeServerDetails?.id &&
        !currentUser
      ) {
        serverListenerUnsubscribe();
        setServerListenerUnsubscribe(null);
      }
    };
  }, [
    activeServerDetails?.id,
    currentUser,
    userRole,
    navigateTo,
    currentScreen,
    clearUserActiveServerId,
  ]);

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true);
    try {
      await promptGoogleAsync();
      return auth.currentUser;
    } catch (error: any) {
      console.error("Google login prompt error:", error);
      showAppAlert(
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
      return auth.currentUser;
    } catch (error: any) {
      console.error("Facebook login prompt error:", error);
      showAppAlert(
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
      if (currentUser && userProfile?.activePlayerServerId) {
        await clearUserActiveServerId(UserRole.PLAYER);
      }
      if (currentUser && userProfile?.activeGmServerId) {
        await clearUserActiveServerId(UserRole.GM);
      }
      await firebaseSignOut();
    } catch (error: any) {
      showAppAlert(
        "Erro de Logout",
        error.message || "Não foi possível fazer logout."
      );
    }
  };

  const setUserRole = useCallback((role: UserRole | null) => {
    setUserRoleState(role);
  }, []);

  const updateCharacterInProgress = useCallback(
    <K extends keyof Character>(key: K, value: Character[K] | undefined) => {
      setCharacterInProgress((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const finalizeCharacter = useCallback((): Character | null => {
    if (!characterInProgress.name || !characterInProgress.primarySkillName) {
      showAppAlert(
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

  const setActiveGameSetup = useCallback((gameSetup: GameSetupState | null) => {
    setActiveGameSetupState(gameSetup);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoadingAuth,
        userProfile,
        fetchUserProfile,
        clearUserActiveServerId,
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
        activeGameSetup,
        setActiveGameSetup,
        gameplayState,
        setGameplayState,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
