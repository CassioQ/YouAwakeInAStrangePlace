import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";

import { colors } from "./styles/colors";
import { AppContext, AppProvider } from "./contexts/AppContexts";
import {
  ScreenEnum,
  UserRole as UserRoleEnum,
} from "./models/enums/CommomEnuns"; // aliased UserRole to UserRoleEnum

// Import screens
import LoginScreen from "./pages/login/LoginScreen";
import EmailLoginScreen from "./pages/login/EmailLoginScreen";
import EmailSignUpScreen from "./pages/login/EmailSignUpScreen";
import AccessScreen from "./pages/AccessScreen";
import CharacterSheetScreen from "./pages/CharacterSheetScreen";
import HomeScreen from "./pages/HomeScreen";
import CreateServerScreen from "./pages/gm/CreateServerScreen";
import GMLobbyScreen from "./pages/gm/GMLobbyScreen";
import PlayerLobbyScreen from "./pages/player/PlayerLobbyScreen";
import GameSetupScreen from "./pages/game_setup/GameSetupScreen";
import GMGameSetupMonitorScreen from "./pages/game_setup/GMGameSetupMonitorScreen";
import PlayerGameplayScreen from "./pages/gameplay/PlayerGameplayScreen"; // Added

const AppContent: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: Context not available.</Text>
      </View>
    );
  }

  const { currentUser, isLoadingAuth, currentScreen, userRole } = context; // Added userRole for gameplay navigation

  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verificando sessão...</Text>
      </View>
    );
  }

  if (!currentUser) {
    switch (currentScreen) {
      case ScreenEnum.LOGIN:
        return <LoginScreen />;
      case ScreenEnum.EMAIL_LOGIN:
        return <EmailLoginScreen />;
      case ScreenEnum.EMAIL_SIGNUP:
        return <EmailSignUpScreen />;
      default:
        console.log(
          "[App.tsx] No user, defaulting to LOGIN screen from:",
          ScreenEnum[currentScreen]
        );
        return <LoginScreen />;
    }
  }

  // Log currentScreen for debugging
  console.log(
    "[App.tsx] Current Screen:",
    ScreenEnum[currentScreen],
    `(${currentScreen})`,
    "Role:",
    userRole ? userRole : "None" // Changed UserRole to UserRoleEnum
  );

  switch (currentScreen) {
    case ScreenEnum.HOME:
      return <HomeScreen />;
    case ScreenEnum.ACCESS_SERVER:
      return <AccessScreen />;
    case ScreenEnum.CREATE_SERVER:
      return <CreateServerScreen />;
    case ScreenEnum.GM_LOBBY:
      return <GMLobbyScreen />;
    case ScreenEnum.PLAYER_LOBBY:
      return <PlayerLobbyScreen />;
    case ScreenEnum.GAME_SETUP_PLAYER:
      return <GameSetupScreen />;
    case ScreenEnum.GAME_SETUP_GM_MONITOR:
      return <GMGameSetupMonitorScreen />;
    case ScreenEnum.PLAYER_GAMEPLAY: // Added
      return <PlayerGameplayScreen />;
    // case ScreenEnum.GM_GAMEPLAY: // To be added
    //   return <GMGameplayScreen />;
    case ScreenEnum.CHARACTER_SHEET:
      return <CharacterSheetScreen />;
    default:
      if (
        currentScreen === ScreenEnum.LOGIN ||
        currentScreen === ScreenEnum.EMAIL_LOGIN ||
        currentScreen === ScreenEnum.EMAIL_SIGNUP
      ) {
        console.log(
          "[App.tsx] User logged in, was on login screen, navigating to HOME from:",
          ScreenEnum[currentScreen]
        );
        return <HomeScreen />;
      }
      console.log(
        "[App.tsx] User logged in, defaulting to HOME screen from unexpected screen:",
        ScreenEnum[currentScreen]
      );
      return <HomeScreen />;
  }
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.backgroundDefault}
      />
      <AppContent />
    </AppProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundDefault,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default App;
