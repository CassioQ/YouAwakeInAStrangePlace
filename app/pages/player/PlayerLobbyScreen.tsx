import React, { useContext, useEffect, useState } from "react";
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
import { PlayerInLobby, GameServer, GameServerStatus, GameSetupState, GameplayState } from "../../models/GameServer.types"; 
import { 
  listenToLobbyPlayers, 
  leaveGameServer, 
  updateServerTimestamps 
} from "../../services/serverManagementServices";
import { listenToServerStatusAndPhase } from "../../services/gameSetupServices";
import { ScreenEnum, UserRole, GamePhase } from "../../models/enums/CommomEnuns"; // Added GamePhase here
import { Unsubscribe } from "firebase/firestore";
import StyledButton from "../../components/StyledButton";
import { showAppAlert } from '../../utils/alertUtils';

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

      unsubscribeStatusListener = listenToServerStatusAndPhase( 
        globalActiveServerDetails.id,
        (status: GameServerStatus, gamePhase: GamePhase | undefined, gameSetupData: GameSetupState | undefined, gameplayData: GameplayState | undefined) => { 
           setServerDetails(prev => {
             if (!prev) return null;
             const newDetails: GameServer = {
                  ...prev, 
                  status, 
                  gamePhase: gamePhase || prev.gamePhase, 
                  gameSetup: gameSetupData || prev.gameSetup,
                  gameplay: gameplayData || prev.gameplay
             };
             return newDetails;
           });
           setActiveGameSetup(gameSetupData || null); 

           if (gamePhase === GamePhase.SETUP && gameSetupData) { 
            navigateTo(ScreenEnum.GAME_SETUP_PLAYER); 
          } else if (gamePhase === GamePhase.ACTIVE && gameplayData) {
            navigateTo(ScreenEnum.PLAYER_GAMEPLAY);
          } else if (gamePhase === GamePhase.ENDED) {
            showAppAlert("Partida Finalizada", "O mestre encerrou a partida.");
            handleLeaveLobby(true); 
          }
        }
      );
      setLoadingLobby(false);
    } else {
      showAppAlert("Erro", "Nenhum servidor ativo. Retornando ao início.");
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
  
  const otherPlayers = lobbyPlayers.filter(p => p.userId !== currentUser?.uid);

  const renderListHeader = () => (
    <>
      {serverDetails && (
        <View style={[styles.serverInfoBox, commonStyles.dashedBorder, commonStyles.shadow]}>
          <Text style={styles.infoLabel}>Servidor:</Text>
          <Text style={styles.infoValue}>{serverDetails.serverName}</Text>
          {serverDetails.gamePhase === GamePhase.LOBBY && (
            <Text style={styles.waitingMessage}>Aguardando o Mestre iniciar a partida...</Text>
          )}
           {serverDetails.gamePhase === GamePhase.SETUP && !serverDetails.gameSetup && (
            <Text style={[styles.waitingMessage, {color: colors.primary}]}>Preparando configuração do jogo...</Text>
           )}
           {serverDetails.gamePhase === GamePhase.SETUP && serverDetails.gameSetup && (
            <Text style={[styles.waitingMessage, {color: colors.success}]}>Configuração do jogo em andamento!</Text>
           )}
           {serverDetails.gamePhase === GamePhase.ACTIVE && (
            <Text style={[styles.waitingMessage, {color: colors.success}]}>Jogo em Andamento!</Text>
           )}
           {serverDetails.gamePhase === GamePhase.ENDED && (
            <Text style={[styles.waitingMessage, {color: colors.error}]}>Partida Finalizada.</Text>
          )}
        </View>
      )}
      <Text style={styles.playersHeader}>Outros Jogadores ({otherPlayers.length})</Text>
      {otherPlayers.length === 0 && lobbyPlayers.length <=1 && (
        <Text style={styles.emptyLobbyText}>Você é o primeiro aqui ou aguardando outros jogadores...</Text>
      )}
    </>
  );

  const renderListFooter = () => (
     <StyledButton onPress={() => handleLeaveLobby()} props_variant="secondary" style={styles.leaveButton}>
        Sair do Lobby
      </StyledButton>
  );


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
  
  return (
    <ScreenWrapper title="LOBBY DO JOGADOR" childHandlesScrolling={true}>
      <FlatList
        style={{ flex: 1 }}
        data={otherPlayers}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        renderItem={({ item }: { item: PlayerInLobby }) => (
          <View style={[styles.playerCard, commonStyles.shadow]}>
            <Image source={{ uri: item.avatarUrl || defaultAvatar.replace("name=P", `name=${encodeURIComponent(item.playerName[0]) || 'P'}`) }} style={styles.playerAvatar} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.playerName}</Text>
              <Text style={styles.characterName}>
                Personagem: {item.characterName || "A definir..."}
              </Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.userId + "_" + (item.characterId || 'nochar_lobby')}
        contentContainerStyle={styles.listContentContainer}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContentContainer: {
     paddingHorizontal: 16, // Added to match ScreenWrapper
     paddingBottom: 20, 
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
