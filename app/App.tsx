import React, { useContext } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme"; // Import the custom theme

// Import screens
import { AppContext, AppProvider } from "./contexts/AppContexts";
import { ScreenEnum } from "./models/enums/CommomEnuns";
import HomeScreen from "./pages/HomeScreem";
import AccessScreen from "./pages/AccessScreen";
import CharacterDevDetailsScreen from "./pages/CharacterDevDetailsScreen";
import CharacterDevNameDescScreen from "./pages/CharacterDevNameDescScreen";
import CharacterDevThemeScreen from "./pages/CharacterDevThemeScreen";
import CharacterSheetScreen from "./pages/CharacterSheetScreen";

const AppContent: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <div>Loading context...</div>;
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
    <ThemeProvider theme={theme}>
      <CssBaseline />{" "}
      {/* Applies baseline styles and dark mode compatibility */}
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
