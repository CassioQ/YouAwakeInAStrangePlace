import React, { useContext } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import StyledButton from "../../components/StyledButton";
import MushroomIcon from "../../components/icons/MushroomIcon";
import { colors } from "../../styles/colors";
import { AppContext } from "../../contexts/AppContexts";
import { ScreenEnum } from "../../models/enums/CommomEnuns";

const LoginScreen: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return null;
  const { loginWithGoogle, loginWithFacebook, navigateTo } = context;

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
    // Navigation is handled by onAuthStateChanged in AppContext
  };

  const handleFacebookLogin = async () => {
    await loginWithFacebook();
    // Navigation is handled by onAuthStateChanged in AppContext
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MushroomIcon size={120} style={styles.icon} />
        <Text style={styles.title}>You Awaken in a Strange Place</Text>
        <Text style={styles.subtitle}>Companion App</Text>

        <View style={styles.buttonContainer}>
          <StyledButton
            onPress={handleGoogleLogin}
            accessibilityLabel="Entrar com Google"
            props_variant="primary"
            style={styles.socialButton}
          >
            Entrar com Google
          </StyledButton>
          <StyledButton
            onPress={handleFacebookLogin}
            accessibilityLabel="Entrar com Facebook"
            props_variant="primary"
            style={[styles.socialButton, styles.facebookButton]}
          >
            Entrar com Facebook
          </StyledButton>
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>
          <StyledButton
            onPress={() => navigateTo(ScreenEnum.EMAIL_LOGIN)}
            accessibilityLabel="Entrar com Email"
            props_variant="secondary"
          >
            Entrar com Email
          </StyledButton>
          <StyledButton
            onPress={() => navigateTo(ScreenEnum.EMAIL_SIGNUP)}
            accessibilityLabel="Criar conta com Email"
            props_variant="secondary"
            style={styles.signUpButton}
          >
            Criar Conta com Email
          </StyledButton>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "90%",
    maxWidth: 380,
    alignItems: "center",
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    width: "100%",
  },
  socialButton: {
    marginBottom: 12,
    backgroundColor: "#DB4437", // Google Red
  },
  facebookButton: {
    backgroundColor: "#3b5998", // Facebook Blue
  },
  signUpButton: {
    marginTop: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default LoginScreen;
