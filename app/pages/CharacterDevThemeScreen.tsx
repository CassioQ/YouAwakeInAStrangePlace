import React, { useContext, useState, useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";

const CharacterDevThemeScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { characterInProgress, updateCharacterInProgress, navigateTo } =
    context;
  const [themeInput, setThemeInput] = useState(characterInProgress.theme || "");

  useEffect(() => {
    setThemeInput(characterInProgress.theme || "");
  }, [characterInProgress.theme]);

  const handleNext = () => {
    updateCharacterInProgress("theme", themeInput);
    navigateTo(ScreenEnum.CHARACTER_CREATE_DETAILS);
  };

  return (
    <ScreenWrapper title="DEV_PERSONAGEM" maxWidth="xs">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <StyledInput
          label="TEMATICA"
          value={themeInput}
          onChange={(e) => setThemeInput(e.target.value)}
          placeholder="Ex: Cyberpunk, Fantasia Sombria, Espacial..."
          required
          autoFocus
        />
      </Paper>
      <Box sx={{ mt: 3 }}>
        <StyledButton
          onClick={handleNext}
          disabled={!themeInput.trim()}
          props_variant="primary"
        >
          OK
        </StyledButton>
      </Box>
    </ScreenWrapper>
  );
};

export default CharacterDevThemeScreen;
