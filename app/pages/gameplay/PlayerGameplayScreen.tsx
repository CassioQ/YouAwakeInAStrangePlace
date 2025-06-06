import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { AppContext } from "../../contexts/AppContexts";
import { GameplayState, GameLogEntry } from "../../models/GameServer.types";
import { ScreenEnum } from "../../models/enums/CommomEnuns";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import PlayerFooter from "../../components/gameplay/PlayerFooter";
import PlayerListFAB from "../../components/gameplay/PlayerListFAB";
// Import listenToGameplayState if not already handled by AppContext's main listener
// import { listenToGameplayState } from "../../services/firebaseServices";
// import { Unsubscribe } from "firebase/firestore";

const PlayerGameplayScreen: React.FC = () => {
  const context = useContext(AppContext);
  // const [localGameplayState, setLocalGameplayState] = useState<GameplayState | null>(null);
  // const [loadingGameplay, setLoadingGameplay] = useState(true);

  if (!context) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Erro: Contexto não disponível.</Text>
      </View>
    );
  }

  const { currentUser, activeServerDetails, gameplayState, navigateTo } = context;

  // Gameplay state is now managed by AppContext and updated by its listener
  // useEffect(() => {
  //   let unsubscribe: Unsubscribe | undefined;
  //   if (activeServerDetails?.id) {
  //     setLoadingGameplay(true);
  //     unsubscribe = listenToGameplayState(activeServerDetails.id, (gameplay) => {
  //       setLocalGameplayState(gameplay || null);
  //       setLoadingGameplay(false);
  //     });
  //   } else {
  //     setLocalGameplayState(null);
  //     setLoadingGameplay(false);
  //   }
  //   return () => {
  //     if (unsubscribe) unsubscribe();
  //   };
  // }, [activeServerDetails?.id]);

  if (!currentUser || !activeServerDetails) {
    // Should not happen if navigation is correct, but good failsafe
    useEffect(() => {
      navigateTo(ScreenEnum.HOME);
    }, [navigateTo]);
    return (
      <View style={styles.loadingContainer}>
        <Text>Erro: Dados do jogador ou servidor ausentes. Redirecionando...</Text>
      </View>
    );
  }

  if (!gameplayState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.infoText}>Carregando dados do jogo...</Text>
      </View>
    );
  }

  const myPlayerGameplayState = gameplayState.playerStates[currentUser.uid];

  if (!myPlayerGameplayState) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Erro: Dados do seu personagem não encontrados no jogo.</Text>
        <PlayerFooter characterName="Desconhecido" currentHp={0} maxHp={0} skills={[]} serverId={activeServerDetails.id} playerId={currentUser.uid} playerName={currentUser.displayName || "Jogador"} />
      </View>
    );
  }

  const renderGameLog = () => {
    if (!gameplayState.gameLog || gameplayState.gameLog.length === 0) {
      return <Text style={styles.emptyLogText}>Nenhuma atividade no jogo ainda.</Text>;
    }
    return gameplayState.gameLog.slice().reverse().map((entry: GameLogEntry) => ( // Slice to avoid mutating original, reverse for newest first
      <View key={entry.id} style={styles.logEntry}>
        <Text style={styles.logTimestamp}>
          {/* @ts-ignore TODO: fix timestamp type */}
          {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleTimeString() : 'agora'}
        </Text>
        <Text style={styles.logMessage}>
          <Text style={styles.logPlayerName}>{entry.playerName || entry.type}: </Text>
          {entry.message}
        </Text>
      </View>
    ));
  };


  return (
    <View style={styles.screenContainer}>
      <PlayerListFAB players={Object.values(gameplayState.playerStates)} />
      
      <ScrollView 
        style={styles.chatArea}
        contentContainerStyle={styles.chatContentContainer}
        ref={ref => { /* Store ref to scroll to bottom on new messages */}}
      >
        {/* Chat messages will go here - Render Game Log for now */}
        {renderGameLog()}
      </ScrollView>

      <PlayerFooter
        characterName={myPlayerGameplayState.characterName}
        currentHp={myPlayerGameplayState.currentHp}
        maxHp={myPlayerGameplayState.maxHp}
        skills={myPlayerGameplayState.assignedSkills}
        serverId={activeServerDetails.id}
        playerId={currentUser.uid}
        playerName={currentUser.displayName || myPlayerGameplayState.characterName || "Jogador"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10, // Space for PlayerListFAB potentially
  },
  chatContentContainer: {
    paddingBottom: 10, // Ensure last message isn't hidden by footer
  },
  emptyLogText: {
    textAlign: 'center',
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 20,
  },
  logEntry: {
    backgroundColor: colors.stone100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  logTimestamp: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 2,
  },
  logMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logPlayerName: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  }
});

export default PlayerGameplayScreen;
