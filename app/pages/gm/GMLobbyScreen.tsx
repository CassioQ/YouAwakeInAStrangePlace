import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  AppState,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import {
  PlayerInLobby,
  GameServer,
  GameServerStatus,
} from "../../models/GameServer.types";
import {
  listenToLobbyPlayers,
  getGameServerDetails,
  startGame,
  listenToServerStatus,
  updateServerTimestamps,
} from "../../services/firebaseServices";
import { ScreenEnum, UserRole } from "../../models/enums/CommomEnuns";
import { Unsubscribe } from "firebase/firestore";
import StyledButton from "../../components/StyledButton";
import { showAppAlert } from "../../utils/alertUtils";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=60";

const GMLobbyScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [serverDetails, setServerDetails] = useState<GameServer | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInLobby[]>([]);
  const [loadingServer, setLoadingServer] = useState(true);
  const [startingGame, setStartingGame] = useState(false);

  if (!context) return null;
  const {
    activeServerDetails,
    navigateTo,
    setActiveServerDetails: setGlobalActiveServer,
    currentUser,
    clearUserActiveServerId,
    setActiveGameSetup,
  } = context;

  useEffect(() => {
    const updateGmSeen = async () => {
      if (serverDetails?.id && currentUser?.uid === serverDetails.gmId) {
        await updateServerTimestamps(serverDetails.id, true);
      }
    };

    updateGmSeen();
    const intervalId = setInterval(updateGmSeen, 60 * 1000);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        updateGmSeen();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [serverDetails?.id, currentUser?.uid, serverDetails?.gmId]);

  useEffect(() => {
    let unsubscribePlayerListener: Unsubscribe | null = null;
    let unsubscribeStatusListener: Unsubscribe | null = null;

    const fetchAndListen = async () => {
      if (activeServerDetails?.id) {
        setLoadingServer(true);
        const details = await getGameServerDetails(activeServerDetails.id);
        if (details) {
          setServerDetails(details);
          setGlobalActiveServer(details);
          setActiveGameSetup(details.gameSetup || null);

          unsubscribePlayerListener = listenToLobbyPlayers(
            activeServerDetails.id,
            (players) => {
              setLobbyPlayers(players);
            }
          );
          unsubscribeStatusListener = listenToServerStatus(
            activeServerDetails.id,
            (status, gameSetupData) => {
              setServerDetails((prev) =>
                prev
                  ? {
                      ...prev,
                      status,
                      gameSetup: gameSetupData || prev.gameSetup,
                    }
                  : null
              );
              setActiveGameSetup(gameSetupData || null);
              if (status === "in-progress") {
                navigateTo(ScreenEnum.GAME_SETUP_GM_MONITOR);
              }
            }
          );
        } else {
          showAppAlert(
            "Erro",
            "Não foi possível carregar os detalhes do servidor."
          );
          if (currentUser) await clearUserActiveServerId(UserRole.GM);
          navigateTo(ScreenEnum.HOME);
        }
        setLoadingServer(false);
      } else {
        showAppAlert("Erro", "Nenhum servidor ativo selecionado.");
        navigateTo(ScreenEnum.CREATE_SERVER);
      }
    };

    fetchAndListen();

    return () => {
      if (unsubscribePlayerListener) unsubscribePlayerListener();
      if (unsubscribeStatusListener) unsubscribeStatusListener();
    };
  }, [
    activeServerDetails?.id,
    navigateTo,
    setGlobalActiveServer,
    currentUser,
    clearUserActiveServerId,
    setActiveGameSetup,
  ]);

  const handleCloseLobby = async () => {
    if (currentUser) {
      await clearUserActiveServerId(UserRole.GM);
    }
    setGlobalActiveServer(null);
    setActiveGameSetup(null);
    navigateTo(ScreenEnum.HOME);
  };

  const handleStartGame = async () => {
    if (!serverDetails?.id || lobbyPlayers.length === 0) return;
    setStartingGame(true);
    const success = await startGame(serverDetails.id, lobbyPlayers);
    if (success) {
      // Navigation to GAME_SETUP_GM_MONITOR is handled by the status listener
    } else {
      showAppAlert(
        "Erro",
        "Não foi possível iniciar a partida e a configuração do jogo."
      );
    }
    setStartingGame(false);
  };

  const canStartGame =
    lobbyPlayers.length > 0 && serverDetails?.status === "lobby";

  const renderListHeader = () => (
    <>
      {serverDetails && (
        <View
          style={[
            styles.serverInfoBox,
            commonStyles.dashedBorder,
            commonStyles.shadow,
          ]}
        >
          <Text style={styles.infoLabel}>Nome do Servidor:</Text>
          <Text style={styles.infoValue}>{serverDetails.serverName}</Text>
          <Text style={styles.infoLabel}>Senha:</Text>
          <Text style={styles.infoValue}>
            {serverDetails.password || "(Servidor Aberto)"}
          </Text>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text
            style={[
              styles.infoValue,
              {
                color:
                  serverDetails.status === "in-progress"
                    ? colors.success
                    : colors.textPrimary,
              },
            ]}
          >
            {serverDetails.status === "lobby" && "Aguardando Jogadores"}
            {serverDetails.status === "in-progress" && "Partida em Andamento"}
            {serverDetails.status === "finished" && "Partida Finalizada"}
          </Text>
        </View>
      )}

      <StyledButton
        onPress={handleStartGame}
        disabled={!canStartGame || startingGame}
        props_variant="primary"
        style={styles.startGameButton}
      >
        {startingGame ? "Iniciando..." : "INICIAR PARTIDA"}
      </StyledButton>

      <Text style={styles.playersHeader}>
        Jogadores no Lobby ({lobbyPlayers.length})
      </Text>
      {lobbyPlayers.length === 0 && (
        <Text style={styles.emptyLobbyText}>Aguardando jogadores...</Text>
      )}
    </>
  );

  const renderListFooter = () => (
    <StyledButton
      onPress={handleCloseLobby}
      props_variant="secondary"
      style={styles.closeLobbyButton}
    >
      Fechar Lobby e Voltar
    </StyledButton>
  );

  if (loadingServer) {
    return (
      <ScreenWrapper title="LOBBY DO MESTRE">
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando lobby...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!serverDetails) {
    return (
      <ScreenWrapper title="LOBBY DO MESTRE">
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>
            Detalhes do servidor não encontrados.
          </Text>
          <StyledButton
            onPress={() => navigateTo(ScreenEnum.HOME)}
            props_variant="primary"
          >
            Voltar
          </StyledButton>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      title={`MONITOR: ${activeServerDetails?.serverName || "Lobby do Mestre"}`}
      childHandlesScrolling={true}
    >
      <FlatList
        style={{ flex: 1 }}
        data={lobbyPlayers}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        renderItem={({ item }: { item: PlayerInLobby }) => (
          <View style={[styles.playerCard, commonStyles.shadow]}>
            <Image
              source={{
                uri:
                  item.avatarUrl ||
                  defaultAvatar.replace(
                    "name=P",
                    `name=${encodeURIComponent(item.playerName[0]) || "P"}`
                  ),
              }}
              style={styles.playerAvatar}
            />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.playerName}</Text>
              <Text style={styles.characterName}>
                Personagem: {item.characterName || "Aguardando..."}
              </Text>
              {item.skills && item.skills.length > 0 ? (
                <>
                  <Text style={styles.skillsTitle}>Habilidades:</Text>
                  {item.skills.map((skill, index) => (
                    <Text key={index} style={styles.skillText}>
                      - {skill.name} (
                      {skill.modifier >= 0
                        ? `+${skill.modifier}`
                        : skill.modifier}
                      )
                    </Text>
                  ))}
                </>
              ) : (
                <Text style={styles.skillText}>
                  Habilidades ainda não definidas.
                </Text>
              )}
            </View>
          </View>
        )}
        keyExtractor={(item) =>
          item.userId + "_" + (item.characterId || "nochar")
        }
        contentContainerStyle={styles.listContentContainer}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centeredMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  serverInfoBox: {
    backgroundColor: colors.backgroundPaper,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "bold",
    marginBottom: 8,
    paddingLeft: 5,
  },
  startGameButton: {
    marginBottom: 20,
  },
  playersHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 5,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  playerCard: {
    backgroundColor: colors.stone100,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: colors.stone200,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  characterName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 5,
  },
  skillText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  emptyLobbyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 20,
    fontStyle: "italic",
  },
  closeLobbyButton: {
    marginTop: 20,
  },
});

export default GMLobbyScreen;
