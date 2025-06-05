import React, { useContext, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native"; // Alert removed
import { AppContext } from "../../contexts/AppContexts";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import ScreenWrapper from "../../components/ScreenWrapper";
import StyledButton from "../../components/StyledButton";
import StyledInput from "../../components/StyledInput";
import { ScreenEnum } from "../../models/enums/CommomEnuns";
import { colors } from "../../styles/colors";
import { showAppAlert } from '../../utils/alertUtils'; // Import the utility

const EmailLoginScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!context) return null;
  const { navigateTo } = context;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAppAlert("Erro", "Email e senha são obrigatórios."); // Replaced
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao tentar fazer login.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Email ou senha inválidos.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "O formato do email é inválido.";
      }
      console.error("Email login error:", error);
      showAppAlert("Erro de Login", errorMessage); // Replaced
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper title="LOGIN COM EMAIL">
      <View style={styles.container}>
        <StyledInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seuemail@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />
        <StyledInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Sua senha"
          secureTextEntry
        />
        <StyledButton
          onPress={handleLogin}
          disabled={loading}
          props_variant="primary"
          style={styles.loginButton}
        >
          {loading ? "Entrando..." : "ENTRAR"}
        </StyledButton>
        <TouchableOpacity
          onPress={() =>
            showAppAlert("Esqueci Senha", "Funcionalidade a ser implementada.") // Replaced
          }
        >
          <Text style={styles.linkText}>Esqueci minha senha</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateTo(ScreenEnum.EMAIL_SIGNUP)}>
          <Text style={styles.linkText}>Não tem uma conta? Cadastre-se</Text>
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
  loginButton: {
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

export default EmailLoginScreen;
