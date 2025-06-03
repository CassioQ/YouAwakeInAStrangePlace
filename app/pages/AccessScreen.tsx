import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";

const AccessScreen: React.FC = () => {
  const [serverName, setServerName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const context = useContext(AppContext);

  const handleSubmit = () => {
    // Basic validation
    if (!serverName.trim() || !accessCode.trim()) {
      Alert.alert(
        "Erro",
        "Nome do servidor e código de acesso são obrigatórios."
      );
      return;
    }

    console.log("Tentativa de acesso ao servidor:", { serverName, accessCode });
    if (context) {
      Alert.alert(
        "Acesso Simulado",
        `Acesso ao servidor: ${serverName} com código: ${accessCode}. Funcionalidade a ser implementada.`
      );
      context.navigateTo(ScreenEnum.HOME);
    }
  };

  return (
    <ScreenWrapper title="ACESSO">
      <View style={[styles.paper, commonStyles.shadow]}>
        <Text
          style={[
            styles.title,
            commonStyles.textUppercase,
            commonStyles.fontWeightMedium,
          ]}
        >
          SERVIDOR
        </Text>
        <StyledInput
          label="Nome"
          value={serverName}
          onChangeText={setServerName}
          placeholder="Nome do Servidor"
          autoFocus
        />
        <StyledInput
          label="Acesso"
          value={accessCode}
          onChangeText={setAccessCode}
          placeholder="Código de Acesso"
          secureTextEntry // If it's like a password
        />
        <View style={styles.buttonWrapper}>
          <StyledButton onPress={handleSubmit} props_variant="primary">
            OK
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
    marginHorizontal: 10, // Ensure it doesn't touch screen edges if ScreenWrapper has no padding
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 24,
    color: colors.textPrimary,
  },
  buttonWrapper: {
    marginTop: 16, // Add some space above the button
  },
});

export default AccessScreen;
