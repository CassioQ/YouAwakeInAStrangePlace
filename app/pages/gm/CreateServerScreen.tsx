import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import StyledInput from "../../components/StyledInput";
import StyledButton from "../../components/StyledButton";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { ScreenEnum } from "../../models/enums/CommomEnuns";
import { createGameServer } from "../../services/firebaseServices";

const CreateServerScreen: React.FC = () => {
  const [serverName, setServerName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useContext(AppContext);

  if (!context) return null;
  const { navigateTo, setActiveServerDetails, currentUser } = context;

  // useEffect(() => {
  //   // Client-side cleanup removed
  //   // if (currentUser?.uid) {
  //   //   cleanupOldUserServers(currentUser.uid)
  //   //     .catch(err => console.warn("Client-side cleanup check failed silently:", err));
  //   // }
  // }, [currentUser?.uid]);

  const handleSubmit = async () => {
    if (!serverName.trim()) {
      Alert.alert("Erro", "Nome do servidor é obrigatório.");
      return;
    }

    if (!currentUser) {
      Alert.alert("Erro", "Usuário não autenticado.");
      navigateTo(ScreenEnum.LOGIN);
      return;
    }

    setLoading(true);
    try {
      // Client-side cleanup removed
      // await cleanupOldUserServers(currentUser.uid);

      const newServer = await createGameServer(serverName, password);
      if (newServer) {
        setActiveServerDetails(newServer);
        navigateTo(ScreenEnum.GM_LOBBY);
        Alert.alert("Sucesso", `Servidor "${serverName}" criado!`);
      } else {
        Alert.alert("Erro", "Não foi possível criar o servidor.");
      }
    } catch (error: any) {
      console.error("Server creation error:", error);
      Alert.alert(
        "Erro ao Criar Servidor",
        error.message || "Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper title="CRIAR SERVIDOR">
      <View style={[styles.paper, commonStyles.shadow]}>
        <Text
          style={[
            styles.title,
            commonStyles.textUppercase,
            commonStyles.fontWeightMedium,
          ]}
        >
          NOVO SERVIDOR
        </Text>
        <StyledInput
          label="Nome do Servidor"
          value={serverName}
          onChangeText={setServerName}
          placeholder="Ex: Aventura Épica"
          autoFocus
        />
        <StyledInput
          label="Senha do Servidor (Opcional)"
          value={password}
          onChangeText={setPassword}
          placeholder="Deixe em branco para servidor aberto"
          secureTextEntry
        />
        <Text style={styles.securityNote}>
          Lembre-se: senhas de servidor são para conveniência, não segurança
          robusta. Servidores vazios por muito tempo serão removidos
          automaticamente.
        </Text>
        <View style={styles.buttonWrapper}>
          <StyledButton
            onPress={handleSubmit}
            props_variant="primary"
            disabled={loading}
          >
            {loading ? "Criando..." : "CRIAR SERVIDOR"}
          </StyledButton>
        </View>
        <StyledButton
          onPress={() => navigateTo(ScreenEnum.HOME)}
          props_variant="secondary"
          style={{ marginTop: 10 }}
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
  securityNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
    fontStyle: "italic",
  },
});

export default CreateServerScreen;
