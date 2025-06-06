import React, { useContext, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native"; // Alert removed
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";
import { showAppAlert } from '../utils/alertUtils'; // Import the utility

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
    if (!themeInput.trim()) {
      showAppAlert("Campo Obrigatório", "Por favor, insira a temática."); // Replaced
      return;
    }
    updateCharacterInProgress("theme", themeInput);
    navigateTo(ScreenEnum.CHARACTER_CREATE_DETAILS);
  };

  return (
    <ScreenWrapper title="DEV_PERSONAGEM">
      <View style={[styles.paper, commonStyles.shadow]}>
        <StyledInput
          label="TEMATICA"
          value={themeInput}
          onChangeText={setThemeInput}
          placeholder="Ex: Cyberpunk, Fantasia Sombria..."
          autoFocus
        />
      </View>
      <View style={styles.buttonWrapper}>
        <StyledButton
          onPress={handleNext}
          disabled={!themeInput.trim()}
          props_variant="primary"
        >
          OK
        </StyledButton>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.backgroundPaper,
    padding: 20,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  buttonWrapper: {
    marginTop: 24,
    marginHorizontal: 10,
  },
});

export default CharacterDevThemeScreen;