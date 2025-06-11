import React, { useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AppContext } from "../../contexts/AppContexts";
import {
  GameplayState,
  GameLogEntry,
  DefinedSkill,
} from "../../models/GameServer.types";
import { ScreenEnum, GameLogEntryType } from "../../models/enums/CommomEnuns";
import { colors } from "../../styles/colors";
import PlayerFooter from "../../components/gameplay/PlayerFooter";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const PlayerGameplayScreen: React.FC = () => {
  const context = useContext(AppContext);
  const scrollViewRef = useRef<ScrollView>(null);

  if (!context) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Erro: Contexto não disponível.</Text>
      </SafeAreaView>
    );
  }

  const {
    currentUser,
    activeServerDetails,
    gameplayState,
    activeGameSetup,
    navigateTo,
  } = context;

  useEffect(() => {
    if (gameplayState?.gameLog) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [gameplayState?.gameLog]);

  if (!currentUser || !activeServerDetails) {
    useEffect(() => {
      navigateTo(ScreenEnum.HOME);
    }, [navigateTo]);
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>
          Erro: Dados do jogador ou servidor ausentes. Redirecionando...
        </Text>
      </SafeAreaView>
    );
  }

  if (!gameplayState || !activeGameSetup) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.infoText}>Carregando dados do jogo...</Text>
      </SafeAreaView>
    );
  }

  const myPlayerGameplayState = gameplayState.playerStates[currentUser.uid];
  const allDefinedSkills: DefinedSkill[] = activeGameSetup.definedSkills || [];

  if (!myPlayerGameplayState) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Erro: Dados do seu personagem não encontrados no jogo.
          </Text>
        </View>
        <PlayerFooter
          characterName="Desconhecido"
          currentHp={0}
          maxHp={0}
          playerAssignedSkills={[]}
          allDefinedSkills={[]}
          serverId={activeServerDetails.id}
          playerId={currentUser.uid}
          playerName={currentUser.displayName || "Jogador"}
          interferenceTokens={0}
          allPlayerStates={[]}
        />
      </SafeAreaView>
    );
  }

  const renderGameLog = () => {
    if (!gameplayState.gameLog || gameplayState.gameLog.length === 0) {
      return (
        <Text style={styles.emptyLogText}>
          Nenhuma atividade no jogo ainda.
        </Text>
      );
    }
    return gameplayState.gameLog.map((entry: GameLogEntry) => {
      let entrySpecificStyle = {};
      switch (entry.type) {
        case GameLogEntryType.SYSTEM:
          entrySpecificStyle = styles.logEntrySystem;
          break;
        case GameLogEntryType.TOKEN:
          entrySpecificStyle = styles.logEntryToken;
          break;
        case GameLogEntryType.ROLL:
          entrySpecificStyle = styles.logEntryRoll;
          break;
        case GameLogEntryType.GENERIC_ROLL:
          entrySpecificStyle = styles.logEntryGenericRoll;
          break;
        case GameLogEntryType.INFO:
          entrySpecificStyle = styles.logEntryInfo;
          break;
        default:
          break;
      }
      return (
        <View key={entry.id} style={[styles.logEntryBase, entrySpecificStyle]}>
          <Text style={styles.logTimestamp}>
            {entry.timestamp &&
            typeof entry.timestamp === "object" &&
            "toDate" in entry.timestamp
              ? (entry.timestamp as { toDate: () => Date })
                  .toDate()
                  .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
              : "agora"}
          </Text>
          <Text style={styles.logMessage}>
            <Text style={styles.logPlayerName}>
              {entry.playerName || entry.type.toUpperCase()}:{" "}
            </Text>
            {entry.message}
          </Text>
        </View>
      );
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screenContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {renderGameLog()}
          </ScrollView>

          <PlayerFooter
            characterName={myPlayerGameplayState.characterName}
            currentHp={myPlayerGameplayState.currentHp}
            maxHp={myPlayerGameplayState.maxHp}
            playerAssignedSkills={myPlayerGameplayState.assignedSkills}
            allDefinedSkills={allDefinedSkills}
            serverId={activeServerDetails.id}
            playerId={currentUser.uid}
            playerName={
              currentUser.displayName ||
              myPlayerGameplayState.characterName ||
              "Jogador"
            }
            interferenceTokens={myPlayerGameplayState.interferenceTokens}
            allPlayerStates={Object.values(gameplayState.playerStates)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
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
    textAlign: "center",
    marginBottom: 10,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 10,
  },
  chatContentContainer: {
    paddingVertical: 10,
  },
  emptyLogText: {
    textAlign: "center",
    color: colors.textLight,
    fontStyle: "italic",
    marginTop: 20,
  },
  logEntryBase: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    borderColor: colors.divider, // Default border color
  },
  logEntrySystem: {
    borderColor: colors.textSecondary,
    backgroundColor: colors.stone100,
  },
  logEntryToken: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "1A",
  },
  logEntryRoll: {
    borderColor: colors.success,
    backgroundColor: colors.success + "1A",
  },
  logEntryGenericRoll: {
    borderColor: "#FFC107", // Amber/Yellow
    backgroundColor: "#FFC107" + "1A",
  },
  logEntryInfo: {
    borderColor: "#03A9F4", // Light Blue
    backgroundColor: "#03A9F4" + "1A",
  },
  logTimestamp: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 3,
  },
  logMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  logPlayerName: {
    fontWeight: "bold",
    color: colors.textPrimary,
  },
});

export default PlayerGameplayScreen;
