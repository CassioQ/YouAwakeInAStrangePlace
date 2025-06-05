import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"; // Alert removed
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";
import { joinGameServer } from "../services/firebaseServices"; 
import { GameServer } from "../models/GameServer.types";
import { showAppAlert } from '../utils/alertUtils'; // Import the utility

const AccessScreen: React.FC = () => {
  const [serverNameInput, setServerNameInput] = useState("");
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useContext(AppContext);

  if (!context) return null;
  const { navigateTo, currentUser, setActiveServerDetails } = context; 

  const handleSubmit = async () => {
    console.log("AccessScreen: handleSubmit triggered for server name:", serverNameInput); 
    if (!serverNameInput.trim()) {
      showAppAlert("Erro", "Nome do servidor é obrigatório."); // Replaced
      return;
    }

    if (!currentUser) {
      showAppAlert("Erro", "Usuário não autenticado. Por favor, faça login."); // Replaced
      navigateTo(ScreenEnum.LOGIN);
      return;
    }

    setLoading(true);
    try {
      const joinedServer = await joinGameServer(
        serverNameInput,
        accessCodeInput,
        currentUser 
      );

      if (joinedServer) {
        setActiveServerDetails(joinedServer as GameServer); 
        showAppAlert( // Replaced
          "Sucesso!",
          `Você entrou no servidor: ${serverNameInput}.`
        );
        navigateTo(ScreenEnum.PLAYER_LOBBY); 
      }
    } catch (error: any) {
      console.error("Join server error:", error);
      showAppAlert("Erro ao Entrar", error.message || "Verifique os dados e tente novamente."); // Replaced
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
          <StyledButton onPress={handleSubmit} props_variant="primary" disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : "ENTRAR"}
          </StyledButton>
        </View>
         <StyledButton 
            onPress={() => navigateTo(ScreenEnum.HOME)} 
            props_variant="secondary" 
            style={{marginTop: 10}}
          >
            Voltar
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
