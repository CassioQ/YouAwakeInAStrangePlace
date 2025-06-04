import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import StyledButton from "../components/StyledButton";
import MushroomIcon from "../components/icons/MushroomIcon";
import { colors } from "../styles/colors";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum, UserRole } from "../models/enums/CommomEnuns";
import {
  getGameServerDetails,
  deleteGameServer,
  leaveGameServer,
  updateServerTimestamps,
} from "../services/firebaseServices";

const HomeScreen: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return null;
  const {
    currentUser,
    userProfile,
    setUserRole,
    navigateTo,
    setActiveServerDetails,
    clearUserActiveServerId,
    fetchUserProfile, // ensure this is called on auth change
  } = context;

  const handleResumeSession = async (role: UserRole, serverId: string) => {
    const server = await getGameServerDetails(serverId);
    if (server) {
      Alert.alert(
        "Sessão Anterior Encontrada",
        `Você estava na sala "${server.serverName}". Deseja retomá-la?`,
        [
          {
            text: "Retomar Jogo",
            onPress: async () => {
              setUserRole(role);
              setActiveServerDetails(server);
              await updateServerTimestamps(serverId, role === UserRole.GM);
              if (role === UserRole.GM) {
                navigateTo(ScreenEnum.GM_LOBBY);
              } else {
                // Player might need to re-join if not in players list (e.g. due to cleanup)
                // joinGameServer should handle this gracefully if called.
                // For now, assume they are still in players list or re-join logic handles it.
                navigateTo(ScreenEnum.PLAYER_LOBBY);
              }
            },
          },
          {
            text:
              role === UserRole.GM ? "Criar Novo Jogo" : "Entrar em Novo Jogo",
            style: "destructive",
            onPress: async () => {
              if (currentUser) {
                if (role === UserRole.GM) {
                  try {
                    await deleteGameServer(serverId, currentUser.uid);
                    Alert.alert(
                      "Sucesso",
                      `Sala "${server.serverName}" foi removida.`
                    );
                  } catch (error: any) {
                    Alert.alert("Erro ao remover sala antiga", error.message);
                  }
                } else {
                  // Player
                  try {
                    await leaveGameServer(serverId, currentUser.uid);
                  } catch (error: any) {
                    console.warn(
                      "Error leaving old server for player:",
                      error.message
                    );
                  }
                }
                await clearUserActiveServerId(role);
                setUserRole(role); // Set role before navigating
                navigateTo(
                  role === UserRole.GM
                    ? ScreenEnum.CREATE_SERVER
                    : ScreenEnum.ACCESS_SERVER
                );
              }
            },
          },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    } else {
      // Server not found, clear the stale ID
      if (currentUser) {
        await clearUserActiveServerId(role);
      }
      proceedWithRoleSelection(role);
    }
  };

  const proceedWithRoleSelection = (role: UserRole) => {
    setUserRole(role);
    if (role === UserRole.PLAYER) {
      navigateTo(ScreenEnum.ACCESS_SERVER);
    } else {
      navigateTo(ScreenEnum.CREATE_SERVER);
    }
  };

  const handleRoleSelection = async (role: UserRole) => {
    if (!currentUser || !userProfile) {
      proceedWithRoleSelection(role);
      return;
    }

    const serverIdToCheck =
      role === UserRole.GM
        ? userProfile.activeGmServerId
        : userProfile.activePlayerServerId;

    if (serverIdToCheck) {
      await handleResumeSession(role, serverIdToCheck);
    } else {
      proceedWithRoleSelection(role);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MushroomIcon size={120} style={styles.icon} />

        <View style={styles.buttonContainer}>
          <StyledButton
            onPress={() => handleRoleSelection(UserRole.PLAYER)}
            accessibilityLabel="Selecionar papel de Jogador"
            props_variant="primary"
          >
            Jogador
          </StyledButton>
          <View style={{ height: 16 }} />
          <StyledButton
            onPress={() => handleRoleSelection(UserRole.GM)}
            accessibilityLabel="Selecionar papel de Mestre"
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
