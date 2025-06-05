import React, { useContext, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native"; // Alert removed
import { AppContext } from "../../contexts/AppContexts";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../../firebase";
import ScreenWrapper from "../../components/ScreenWrapper";
import StyledButton from "../../components/StyledButton";
import StyledInput from "../../components/StyledInput";
import { ScreenEnum } from "../../models/enums/CommomEnuns";
import { colors } from "../../styles/colors";
import { showAppAlert } from '../../utils/alertUtils'; // Import the utility

const EmailSignUpScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!context) return null;
  const { navigateTo } = context;

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      showAppAlert("Erro", "Todos os campos são obrigatórios."); // Replaced
      return;
    }
    if (password !== confirmPassword) {
      showAppAlert("Erro", "As senhas não coincidem."); // Replaced
      return;
    }
    if (password.length < 6) {
      showAppAlert("Erro", "A senha deve ter pelo menos 6 caracteres."); // Replaced
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao tentar criar a conta.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "O formato do email é inválido.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca.";
      }
      console.error("Email sign up error:", error);
      showAppAlert("Erro de Cadastro", errorMessage); // Replaced
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper title="CRIAR CONTA">
      <View style={styles.container}>
        <StyledInput
          label="Nome de Usuário"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Seu nome de usuário"
          autoFocus
        />
        <StyledInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seuemail@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <StyledInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Crie uma senha (mín. 6 caracteres)"
          secureTextEntry
        />
        <StyledInput
          label="Confirmar Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirme sua senha"
          secureTextEntry
        />
        <StyledButton
          onPress={handleSignUp}
          disabled={loading}
          props_variant="primary"
          style={styles.signUpButton}
        >
          {loading ? "Criando conta..." : "CADASTRAR"}
        </StyledButton>
        <TouchableOpacity onPress={() => navigateTo(ScreenEnum.LOGIN)}>
          <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  signUpButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  linkText: {
    color: colors.primary,
    textAlign: "center",
    marginTop: 15,
    textDecorationLine: "underline",
  },
});

export default EmailSignUpScreen;
