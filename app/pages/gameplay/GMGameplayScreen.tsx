import React, { useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
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
import GMFooter from "../../components/gameplay/GMFooter"; // Import GM Footer

const GMGameplayScreen: React.FC = () => {
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
          Erro: Dados do Mestre ou servidor ausentes. Redirecionando...
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
  
  const allDefinedSkills: DefinedSkill[] = activeGameSetup.definedSkills || [];

  const renderGameLog = () => {
    if (!gameplayState.gameLog || gameplayState.gameLog.length === 0) {
      return (
        <Text style={styles.emptyLogText}>
          Nenhuma atividade no jogo ainda.
        </Text>
      );
    }
    return gameplayState.gameLog.map((entry: GameLogEntry) => (
      <View
        key={entry.id}
        style={[
          styles.logEntry,
          entry.type === GameLogEntryType.SYSTEM && styles.logEntrySystem,
          entry.type === GameLogEntryType.TOKEN && styles.logEntryToken,
        ]}
      >
        <Text style={styles.logTimestamp}>
          {entry.timestamp && typeof entry.timestamp === "object" && "toDate" in entry.timestamp
            ? (entry.timestamp as { toDate: () => Date })
                .toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "agora"}
        </Text>
        <Text style={styles.logMessage}>
          <Text style={styles.logPlayerName}>
            {entry.playerName || entry.type.toUpperCase()}:{" "}
          </Text>
          {entry.message}
        </Text>
      </View>
    ));
  };

  return (
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

        <GMFooter
          allDefinedSkills={allDefinedSkills}
          serverId={activeServerDetails.id}
          gmId={currentUser.uid}
          gmName={currentUser.displayName || "Mestre"}
          allPlayerStates={Object.values(gameplayState.playerStates)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  logEntry: {
    backgroundColor: colors.stone100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  logEntrySystem: {
    backgroundColor: colors.secondary,
  },
  logEntryToken: {
    backgroundColor: colors.primary + "33", 
    borderColor: colors.primary,
    borderWidth: 1,
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
    fontWeight: "bold",
    color: colors.textPrimary,
  },
});

export default GMGameplayScreen;
