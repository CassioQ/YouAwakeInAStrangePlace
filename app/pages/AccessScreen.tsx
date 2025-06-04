import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";
import { joinGameServer } from "../services/firebaseServices"; // Import the service

const AccessScreen: React.FC = () => {
  const [serverNameInput, setServerNameInput] = useState("");
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useContext(AppContext);

  if (!context) return null;
  const { navigateTo, createdCharacter, currentUser, setActiveServerDetails } =
    context;

  const handleSubmit = async () => {
    if (!serverNameInput.trim()) {
      Alert.alert("Erro", "Nome do servidor é obrigatório.");
      return;
    }
    // Access code can be optional if server is open

    if (!createdCharacter) {
      Alert.alert(
        "Personagem Necessário",
        "Você precisa criar um personagem antes de entrar em um servidor."
      );
      navigateTo(ScreenEnum.CHARACTER_CREATE_THEME);
      return;
    }
    if (!currentUser) {
      Alert.alert("Erro", "Usuário não autenticado. Por favor, faça login.");
      navigateTo(ScreenEnum.LOGIN);
      return;
    }

    setLoading(true);
    try {
      const joinedServerId = await joinGameServer(
        serverNameInput,
        accessCodeInput,
        createdCharacter,
        currentUser
      );

      if (joinedServerId) {
        // Optionally, set active server details for the player too if needed for their view
        // For now, just navigate. The GM lobby will show the player.
        // If player needs server details:
        // const serverDetails = await getGameServerDetails(joinedServerId);
        // setActiveServerDetails(serverDetails);

        Alert.alert("Sucesso!", `Você entrou no servidor: ${serverNameInput}.`);
        navigateTo(ScreenEnum.CHARACTER_SHEET); // Or a player-specific lobby/waiting screen
      } else {
        // Error already handled and thrown by joinGameServer if specific
        // Alert.alert("Erro", "Não foi possível entrar no servidor. Verifique os dados.");
      }
    } catch (error: any) {
      console.error("Join server error:", error);
      Alert.alert(
        "Erro ao Entrar",
        error.message || "Verifique os dados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper title="ACESSO AO SERVIDOR">
      <View style={[styles.paper, commonStyles.shadow]}>
        <Text
          style={[
            styles.title,
            commonStyles.textUppercase,
            commonStyles.fontWeightMedium,
          ]}
        >
          ENTRAR EM SERVIDOR
        </Text>
        <StyledInput
          label="Nome do Servidor"
          value={serverNameInput}
          onChangeText={setServerNameInput}
          placeholder="Nome do Servidor"
          autoCapitalize="none"
          autoFocus
        />
        <StyledInput
          label="Senha do Servidor (se houver)"
          value={accessCodeInput}
          onChangeText={setAccessCodeInput}
          placeholder="Senha de Acesso"
          secureTextEntry
        />
        <View style={styles.buttonWrapper}>
          <StyledButton
            onPress={handleSubmit}
            props_variant="primary"
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.white} /> : "ENTRAR"}
          </StyledButton>
        </View>
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
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 24,
    color: colors.textPrimary,
  },
  buttonWrapper: {
    marginTop: 16,
  },
});

export default AccessScreen;
