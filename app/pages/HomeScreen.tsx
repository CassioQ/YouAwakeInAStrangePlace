import React, { useContext } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import StyledButton from "../components/StyledButton";
import MushroomIcon from "../components/icons/MushroomIcon";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum, UserRole } from "../models/enums/CommomEnuns";

const HomeScreen: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return null;
  const { setUserRole, navigateTo } = context;

  const handleRoleSelection = (role: UserRole) => {
    setUserRole(role);
    // Character creation is now deferred, so no need to reset/clear character here
    if (role === UserRole.PLAYER) {
      navigateTo(ScreenEnum.ACCESS_SERVER); // Players go directly to Access Screen
    } else {
      // GM flow
      navigateTo(ScreenEnum.CREATE_SERVER);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MushroomIcon size={120} style={styles.icon} />

        <View style={styles.buttonContainer}>
          <StyledButton
            onPress={() => handleRoleSelection(UserRole.PLAYER)}
            accessibilityLabel="Selecionar papel de Jogador e entrar em um servidor"
            props_variant="primary"
          >
            Jogador
          </StyledButton>
          <View style={{ height: 16 }} />
          <StyledButton
            onPress={() => handleRoleSelection(UserRole.GM)}
            accessibilityLabel="Selecionar papel de Mestre e criar servidor"
            props_variant="secondary"
          >
            Mestre
          </StyledButton>
        </View>

        <Text style={styles.footerText}>Nos pague uma cerveja</Text>
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
  },
  content: {
    width: "80%",
    maxWidth: 320,
    alignItems: "center",
  },
  icon: {
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
  },
  footerText: {
    marginTop: 40,
    color: colors.textSecondary,
    opacity: 0.7,
    fontSize: 14,
  },
});

export default HomeScreen;
