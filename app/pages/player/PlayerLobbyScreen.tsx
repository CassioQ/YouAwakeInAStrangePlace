import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  AppState, 
} from "react-native"; // Alert removed
import ScreenWrapper from "../../components/ScreenWrapper";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { PlayerInLobby, GameServer, GameServerStatus, GameSetupState } from "../../models/GameServer.types";
import { 
  listenToLobbyPlayers, 
  listenToServerStatus, 
  leaveGameServer, 
  updateServerTimestamps 
} from "../../services/firebaseServices";
import { ScreenEnum, UserRole } from "../../models/enums/CommomEnuns";
import { Unsubscribe } from "firebase/firestore";
import StyledButton from "../../components/StyledButton";
import { showAppAlert } from '../../utils/alertUtils'; // Import the utility

const defaultAvatar = "https://ui-avatars.com/api/?name=P&background=random&size=60";

const PlayerLobbyScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [serverDetails, setServerDetails] = useState<GameServer | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInLobby[]>([]);
  const [loadingLobby, setLoadingLobby] = useState(true);

  if (!context) return null;
  const { 
    activeServerDetails: globalActiveServerDetails, 
    navigateTo, 
    setActiveServerDetails: setGlobalActiveServerDetails, 
    currentUser, 
    clearUserActiveServerId,
    setActiveGameSetup 
  } = context;


  useEffect(() => {
    const updatePlayerActivity = async () => {
      if (serverDetails?.id) {
        await updateServerTimestamps(serverDetails.id, false); 
      }
    };
    
    updatePlayerActivity(); 
    const intervalId = setInterval(updatePlayerActivity, 2 * 60 * 1000); 

    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        updatePlayerActivity();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [serverDetails?.id]);


  useEffect(() => {
    let unsubscribePlayerListener: Unsubscribe | null = null;
    let unsubscribeStatusListener: Unsubscribe | null = null;

    if (globalActiveServerDetails?.id) {
      setLoadingLobby(true);
      setServerDetails(globalActiveServerDetails); 
      setActiveGameSetup(globalActiveServerDetails.gameSetup || null);

      unsubscribePlayerListener = listenToLobbyPlayers(
        globalActiveServerDetails.id,
        (players) => {
          setLobbyPlayers(players);
        }
      );

      unsubscribeStatusListener = listenToServerStatus(
        globalActiveServerDetails.id,
        (status, gameSetupData) => { 
           setServerDetails(prev => prev ? { ...prev, status, gameSetup: gameSetupData || prev.gameSetup } : null);
           setActiveGameSetup(gameSetupData || null); 

           if (status === "in-progress" && gameSetupData) { 
            navigateTo(ScreenEnum.GAME_SETUP_PLAYER); 
          } else if (status === "finished") {
            showAppAlert("Partida Finalizada", "O mestre encerrou a partida."); // Replaced
            handleLeaveLobby(true); 
          }
        }
      );
      setLoadingLobby(false);
    } else {
      showAppAlert("Erro", "Nenhum servidor ativo. Retornando ao início."); // Replaced
      navigateTo(ScreenEnum.HOME);
    }

    return () => {
      if (unsubscribePlayerListener) unsubscribePlayerListener();
      if (unsubscribeStatusListener) unsubscribeStatusListener();
    };
  }, [globalActiveServerDetails?.id, navigateTo, setActiveGameSetup]);

  const handleLeaveLobby = async (gameFinished = false) => {
    if (currentUser && serverDetails?.id && !gameFinished) { 
      try {
        await leaveGameServer(serverDetails.id, currentUser.uid);
      } catch (error) {
        console.warn("Error leaving server:", error);
      }
    }
    if(currentUser) {
      await clearUserActiveServerId(UserRole.PLAYER);
    }
    setGlobalActiveServerDetails(null);
    setActiveGameSetup(null); 
    navigateTo(ScreenEnum.HOME);
  };

  if (loadingLobby) {
    return (
      <ScreenWrapper title="LOBBY DO JOGADOR">
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando lobby...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!serverDetails) {
    return (
      <ScreenWrapper title="LOBBY DO JOGADOR">
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>Detalhes do servidor não encontrados.</Text>
          <StyledButton onPress={() => handleLeaveLobby()} props_variant="primary">Voltar</StyledButton>
        </View>
      </ScreenWrapper>
    );
  }
  
  const otherPlayers = lobbyPlayers.filter(p => p.userId !== currentUser?.uid);

  return (
    <ScreenWrapper title="LOBBY DO JOGADOR">
      <View style={styles.container}>
        <View style={[styles.serverInfoBox, commonStyles.dashedBorder, commonStyles.shadow]}>
          <Text style={styles.infoLabel}>Servidor:</Text>
          <Text style={styles.infoValue}>{serverDetails.serverName}</Text>
          {serverDetails.status === 'lobby' && (
            <Text style={styles.waitingMessage}>Aguardando o Mestre iniciar a partida...</Text>
          )}
           {serverDetails.status === 'in-progress' && !serverDetails.gameSetup && (
            <Text style={[styles.waitingMessage, {color: colors.primary}]}>Preparando configuração do jogo...</Text>
           )}
           {serverDetails.status === 'in-progress' && serverDetails.gameSetup && (
            <Text style={[styles.waitingMessage, {color: colors.success}]}>Configuração do jogo em andamento!</Text>
           )}
           {serverDetails.status === 'finished' && (
            <Text style={[styles.waitingMessage, {color: colors.error}]}>Partida Finalizada.</Text>
          )}
        </View>

        <Text style={styles.playersHeader}>Outros Jogadores ({otherPlayers.length})</Text>
        {otherPlayers.length === 0 && lobbyPlayers.length <=1 ? ( 
          <Text style={styles.emptyLobbyText}>Você é o primeiro aqui ou aguardando outros jogadores...</Text>
        ) : (
          <FlatList
            data={otherPlayers}
            renderItem={({ item }: { item: PlayerInLobby }) => (
              <View style={[styles.playerCard, commonStyles.shadow]}>
                <Image source={{ uri: item.avatarUrl || defaultAvatar }} style={styles.playerAvatar} />
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{item.playerName}</Text>
                  <Text style={styles.characterName}>
                    Personagem: {item.characterName || "A definir..."}
                  </Text>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.userId + "_" + (item.characterId || 'nochar_lobby')}
            contentContainerStyle={styles.playerList}
          />
        )}
        <StyledButton onPress={() => handleLeaveLobby()} props_variant="secondary" style={styles.leaveButton}>
          Sair do Lobby
        </StyledButton>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
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
    marginBottom: 20,
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
  waitingMessage: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 5,
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
  playerList: {
    paddingBottom: 10,
  },
  playerCard: {
    backgroundColor: colors.stone100,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.stone200,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  characterName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  emptyLobbyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 20,
    fontStyle: "italic",
  },
  leaveButton: {
      marginTop: 20,
  }
});

export default PlayerLobbyScreen;
