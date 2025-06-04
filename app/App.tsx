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
import { ScreenEnum } from "./models/enums/CommomEnuns";

// Import screens
import LoginScreen from "./pages/login/LoginScreen";
import EmailLoginScreen from "./pages/login/EmailLoginScreen";
import EmailSignUpScreen from "./pages/login/EmailSignUpScreen";
import AccessScreen from "./pages/AccessScreen";
import CharacterDevDetailsScreen from "./pages/CharacterDevDetailsScreen";
import CharacterDevNameDescScreen from "./pages/CharacterDevNameDescScreen";
import CharacterDevThemeScreen from "./pages/CharacterDevThemeScreen";
import CharacterSheetScreen from "./pages/CharacterSheetScreen";
import HomeScreen from "./pages/HomeScreen";
import CreateServerScreen from "./pages/gm/CreateServerScreen";
import GMLobbyScreen from "./pages/gm/GMLobbyScreen";
import PlayerLobbyScreen from "./pages/player/PlayerLobbyScreen";
import GMGameSetupMonitorScreen from "./pages/game_setup/GMGameSetupMonitorScreen";
import GameSetupScreen from "./pages/game_setup/GameSetupScreen";

const AppContent: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: Context not available.</Text>
      </View>
    );
  }

  const { currentUser, isLoadingAuth, currentScreen } = context;

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
        return <LoginScreen />;
    }
  }

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
    case ScreenEnum.CHARACTER_CREATE_THEME:
      return <CharacterDevThemeScreen />;
    case ScreenEnum.CHARACTER_CREATE_DETAILS:
      return <CharacterDevDetailsScreen />;
    case ScreenEnum.CHARACTER_CREATE_NAME_DESC_SKILL:
      return <CharacterDevNameDescScreen />;
    case ScreenEnum.CHARACTER_SHEET:
      return <CharacterSheetScreen />;
    default:
      if (
        currentScreen === ScreenEnum.LOGIN ||
        currentScreen === ScreenEnum.EMAIL_LOGIN ||
        currentScreen === ScreenEnum.EMAIL_SIGNUP
      ) {
        return <HomeScreen />;
      }
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
