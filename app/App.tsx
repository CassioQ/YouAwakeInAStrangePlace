import React, { useContext } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";

import { colors } from "./styles/colors";
import { AppContext, AppProvider } from "./contexts/AppContexts";
import { ScreenEnum } from "./models/enums/CommomEnuns";
import AccessScreen from "./pages/AccessScreen";
import CharacterDevDetailsScreen from "./pages/CharacterDevDetailsScreen";
import CharacterDevNameDescScreen from "./pages/CharacterDevNameDescScreen";
import CharacterDevThemeScreen from "./pages/CharacterDevThemeScreen";
import CharacterSheetScreen from "./pages/CharacterSheetScreen";
import HomeScreen from "./pages/HomeScreen";

const AppContent: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading context...</Text>
      </View>
    );
  }

  const { currentScreen } = context;

  switch (currentScreen) {
    case ScreenEnum.HOME:
      return <HomeScreen />;
    case ScreenEnum.ACCESS_SERVER:
      return <AccessScreen />;
    case ScreenEnum.CHARACTER_CREATE_THEME:
      return <CharacterDevThemeScreen />;
    case ScreenEnum.CHARACTER_CREATE_DETAILS:
      return <CharacterDevDetailsScreen />;
    case ScreenEnum.CHARACTER_CREATE_NAME_DESC_SKILL:
      return <CharacterDevNameDescScreen />;
    case ScreenEnum.CHARACTER_SHEET:
      return <CharacterSheetScreen />;
    default:
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
  },
});

export default App;
