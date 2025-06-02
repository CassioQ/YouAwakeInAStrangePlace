import React, { useContext, useState, useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledTextarea from "../components/StyledTextarea";
import StyledButton from "../components/StyledButton";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";

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
    updateCharacterInProgress("name", name);
    updateCharacterInProgress("playerName", playerName || "@jogador");
    updateCharacterInProgress("description", description);
    updateCharacterInProgress("primarySkillName", primarySkillName);

    const character = finalizeCharacter();
    if (character) {
      navigateTo(ScreenEnum.CHARACTER_SHEET);
    } else {
      alert(
        "Erro ao finalizar personagem. Nome e habilidade principal são obrigatórios."
      );
    }
  };

  return (
    <ScreenWrapper title="FICHA" maxWidth="sm">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <StyledInput
          label="NOME PERSONAGEM"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do seu personagem"
          required
          autoFocus
        />
        <StyledInput
          label="NOME JOGADOR (EX: @JOGADOR)"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="@SeuNomeDeJogador"
        />
        <StyledTextarea
          label="DESCRIÇÃO"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Uma breve descrição do seu personagem..."
          required
          rows={3}
        />
        <StyledInput
          label="HABILIDADE PRINCIPAL"
          value={primarySkillName}
          onChange={(e) => setPrimarySkillName(e.target.value)}
          placeholder="Ex: Investigação, Persuasão, Combate com Lâminas"
          required
        />
      </Paper>
      <Box sx={{ mt: 3 }}>
        <StyledButton
          onClick={handleFinalize}
          disabled={!name.trim() || !primarySkillName.trim()}
          props_variant="primary"
        >
          OK (Finalizar Personagem)
        </StyledButton>
      </Box>
    </ScreenWrapper>
  );
};

export default CharacterDevNameDescScreen;
