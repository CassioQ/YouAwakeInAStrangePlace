import React, { useContext, useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native"; // Alert removed
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledTextarea from "../components/StyledTextarea";
import StyledButton from "../components/StyledButton";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";
import { showAppAlert } from '../utils/alertUtils'; // Import the utility

const CharacterDevNameDescScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const {
    characterInProgress,
    updateCharacterInProgress,
    finalizeCharacter,
    navigateTo,
  } = context;

  const [name, setName] = useState(characterInProgress.name || "");
  const [playerName, setPlayerName] = useState(
    characterInProgress.playerName || ""
  );
  const [description, setDescription] = useState(
    characterInProgress.description || ""
  );
  const [primarySkillName, setPrimarySkillName] = useState(
    characterInProgress.primarySkillName || ""
  );

  useEffect(() => {
    setName(characterInProgress.name || "");
    setPlayerName(characterInProgress.playerName || "");
    setDescription(characterInProgress.description || "");
    setPrimarySkillName(characterInProgress.primarySkillName || "");
  }, [characterInProgress]);

  const handleFinalize = () => {
    if (!name.trim() || !primarySkillName.trim()) {
      showAppAlert( // Replaced
        "Campos Obrigatórios",
        "Nome do Personagem e Habilidade Principal são obrigatórios."
      );
      return;
    }
    updateCharacterInProgress("name", name);
    updateCharacterInProgress("playerName", playerName || "@jogador");
    updateCharacterInProgress("description", description);
    updateCharacterInProgress("primarySkillName", primarySkillName);

    const character = finalizeCharacter();
    if (character) {
      navigateTo(ScreenEnum.CHARACTER_SHEET);
    } else {
      showAppAlert("Erro", "Erro ao finalizar personagem. Verifique os dados."); // Replaced
    }
  };

  return (
    <ScreenWrapper title="FICHA">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ marginHorizontal: 10 }}
      >
        <View style={[styles.paper, commonStyles.shadow]}>
          <StyledInput
            label="NOME PERSONAGEM"
            value={name}
            onChangeText={setName}
            placeholder="Nome do seu personagem"
            autoFocus
          />
          <StyledInput
            label="NOME JOGADOR (EX: @JOGADOR)"
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="@SeuNomeDeJogador"
          />
          <StyledTextarea
            label="DESCRIÇÃO"
            value={description}
            onChangeText={setDescription}
            placeholder="Uma breve descrição do seu personagem..."
            rows={3}
          />
          <StyledInput
            label="HABILIDADE PRINCIPAL"
            value={primarySkillName}
            onChangeText={setPrimarySkillName}
            placeholder="Ex: Investigação, Persuasão"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <StyledButton
            onPress={handleFinalize}
            disabled={!name.trim() || !primarySkillName.trim()}
            props_variant="primary"
          >
            OK (Finalizar Personagem)
          </StyledButton>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.backgroundPaper,
    padding: 20,
    borderRadius: 8,
  },
  buttonWrapper: {
    marginTop: 24,
  },
});

export default CharacterDevNameDescScreen;
