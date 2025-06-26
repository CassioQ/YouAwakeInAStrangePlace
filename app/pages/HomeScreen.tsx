import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
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
} from "../services/serverManagementServices";
import { showAppAlert } from "../utils/alertUtils";

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
    fetchUserProfile,
  } = context;

  const handleResumeSession = async (role: UserRole, serverId: string) => {
    console.log(
      "[HomeScreen] handleResumeSession called for role:",
      role,
      "serverId:",
      serverId
    );
    const server = await getGameServerDetails(serverId);
    if (server) {
      console.log("[HomeScreen] Server found:", server.serverName);
      showAppAlert(
        // Replaced Alert.alert
        "Sessão Anterior Encontrada",
        `Você estava na sala "${server.serverName}". Deseja retomá-la?`,
        [
          {
            text: "Retomar Jogo",
            onPress: async () => {
              console.log("[HomeScreen] Alert: Retomar Jogo pressed");
              setUserRole(role);
              setActiveServerDetails(server);
              await updateServerTimestamps(serverId, role === UserRole.GM);
              if (role === UserRole.GM) {
                navigateTo(ScreenEnum.GM_LOBBY);
              } else {
                navigateTo(ScreenEnum.PLAYER_LOBBY);
              }
            },
          },
          {
            text:
              role === UserRole.GM ? "Criar Novo Jogo" : "Entrar em Novo Jogo",
            style: "destructive",
            onPress: async () => {
              console.log(
                "[HomeScreen] Alert: Criar/Entrar em Novo Jogo pressed"
              );
              if (currentUser) {
                if (role === UserRole.GM) {
                  try {
                    await deleteGameServer(serverId, currentUser.uid);
                    showAppAlert(
                      "Sucesso",
                      `Sala "${server.serverName}" foi removida.`
                    ); // Replaced
                  } catch (error: any) {
                    showAppAlert("Erro ao remover sala antiga", error.message); // Replaced
                  }
                } else {
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
                setUserRole(role);
                navigateTo(
                  role === UserRole.GM
                    ? ScreenEnum.CREATE_SERVER
                    : ScreenEnum.ACCESS_SERVER
                );
              }
            },
          },
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => console.log("[HomeScreen] Alert: Cancelar pressed"),
          },
        ]
      );
    } else {
      console.log(
        "[HomeScreen] Server not found for ID:",
        serverId,
        "Proceeding with new role selection."
      );
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
    if (!currentUser) {
      console.log(
        "[HomeScreen] No currentUser, proceeding with role selection directly."
      );
      proceedWithRoleSelection(role);
      return;
    }
    if (!userProfile) {
      console.log("[HomeScreen] No userProfile, attempting to fetch.");
      await fetchUserProfile(currentUser.uid);
      // After fetch, userProfile might still be null if fetch fails or is async without await here.
      // Consider re-checking userProfile or ensuring fetchUserProfile updates context synchronously for this check.
      // For now, if it was null, the next check might pass or fail based on fetch outcome.
      // A robust way is to ensure userProfile is loaded before this logic runs, often in AppContext.
      console.log("[HomeScreen] userProfile after fetch attempt:", userProfile);
      if (!userProfile) {
        // Re-check after fetch
        console.warn(
          "[HomeScreen] User profile still not available after fetch. Proceeding without session check."
        );
        proceedWithRoleSelection(role);
        return;
      }
    }

    const serverIdToCheck =
      role === UserRole.GM
        ? userProfile.activeGmServerId
        : userProfile.activePlayerServerId;
    console.log("[HomeScreen] Server ID to check:", serverIdToCheck);

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
