import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native"; // Alert removed
import ScreenWrapper from "../../components/ScreenWrapper";
import StyledInput from "../../components/StyledInput";
import StyledButton from "../../components/StyledButton";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { ScreenEnum } from "../../models/enums/CommomEnuns";
import { createGameServer } from "../../services/firebaseServices";
import { showAppAlert } from '../../utils/alertUtils'; // Import the utility

const CreateServerScreen: React.FC = () => {
  const [serverName, setServerName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useContext(AppContext);

  if (!context) return null;
  const { navigateTo, setActiveServerDetails, currentUser } = context;

  const handleSubmit = async () => {
    console.log("CreateServerScreen: handleSubmit triggered for server name:", serverName); 
    if (!serverName.trim()) {
      showAppAlert("Erro", "Nome do servidor é obrigatório."); // Replaced
      return;
    }
    
    if (!currentUser) {
      showAppAlert("Erro", "Usuário não autenticado."); // Replaced
      navigateTo(ScreenEnum.LOGIN);
      return;
    }

    setLoading(true);
    try {
      const newServer = await createGameServer(serverName, password);
      if (newServer) {
        setActiveServerDetails(newServer); 
        navigateTo(ScreenEnum.GM_LOBBY);
        showAppAlert("Sucesso", `Servidor "${serverName}" criado!`); // Replaced
      } else {
        showAppAlert("Erro", "Não foi possível criar o servidor."); // Replaced
      }
    } catch (error: any) {
      console.error("Server creation error:", error);
      showAppAlert("Erro ao Criar Servidor", error.message || "Tente novamente."); // Replaced
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
          Lembre-se: senhas de servidor são para conveniência, não segurança robusta.
           Servidores vazios por muito tempo serão removidos automaticamente.
        </Text>
        <View style={styles.buttonWrapper}>
          <StyledButton onPress={handleSubmit} props_variant="primary" disabled={loading}>
            {loading ? "Criando..." : "CRIAR SERVIDOR"}
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
  securityNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  }
});

export default CreateServerScreen;
