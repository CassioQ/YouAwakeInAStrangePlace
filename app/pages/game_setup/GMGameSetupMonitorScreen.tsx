import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { GameSetupPhase } from "../../models/enums/CommomEnuns";
import { PlayerRoll } from "../../models/GameServer.types";
import { listenToGameSetup } from "../../services/firebaseServices";
import { Unsubscribe } from "firebase/firestore";
import StyledButton from "../../components/StyledButton"; // For future "Start Session" button

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";

const GMGameSetupMonitorScreen: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return null;
  const {
    activeServerDetails,
    activeGameSetup,
    setActiveGameSetup,
    navigateTo,
    currentUser,
  } = context;

  useEffect(() => {
    let unsubscribeGameSetup: Unsubscribe | undefined;
    if (activeServerDetails?.id) {
      unsubscribeGameSetup = listenToGameSetup(
        activeServerDetails.id,
        (setupData) => {
          setActiveGameSetup(setupData || null);
        }
      );
    }
    return () => {
      if (unsubscribeGameSetup) unsubscribeGameSetup();
    };
  }, [activeServerDetails?.id, setActiveGameSetup]);

  const getPlayerNameById = (playerId: string): string => {
    const player = activeServerDetails?.players.find(
      (p) => p.userId === playerId
    );
    return player?.playerName || "Jogador Desconhecido";
  };

  if (!activeServerDetails) {
    return (
      <ScreenWrapper title="MONITORAR CONFIGURAÇÃO">
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>Nenhum servidor ativo.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!activeGameSetup) {
    return (
      <ScreenWrapper title="MONITORAR CONFIGURAÇÃO">
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Carregando dados de configuração...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const allPlayersRolled =
    activeGameSetup.playerRolls &&
    activeGameSetup.numPlayersAtSetupStart > 0 &&
    activeGameSetup.playerRolls.length ===
      activeGameSetup.numPlayersAtSetupStart;

  let currentPhaseDisplay = "Aguardando...";
  switch (activeGameSetup.currentPhase) {
    case GameSetupPhase.ROLLING:
      currentPhaseDisplay = "Rolagem de Dados";
      break;
    case GameSetupPhase.DEFINING_GENRE:
      currentPhaseDisplay = "Definindo Gênero";
      break;
    case GameSetupPhase.DEFINING_ADJECTIVE:
      currentPhaseDisplay = "Definindo Adjetivo";
      break;
    case GameSetupPhase.DEFINING_LOCATION:
      currentPhaseDisplay = "Definindo Local";
      break;
    case GameSetupPhase.CHARACTER_CREATION:
      currentPhaseDisplay = "Criação de Personagens";
      break;
    case GameSetupPhase.READY_TO_PLAY:
      currentPhaseDisplay = "Pronto para Jogar";
      break;
  }

  const currentPlayerDefiningName = activeGameSetup.currentPlayerIdToDefine
    ? getPlayerNameById(activeGameSetup.currentPlayerIdToDefine)
    : "Ninguém";

  return (
    <ScreenWrapper title={`MONITOR: ${activeServerDetails.serverName}`}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerText}>
          Fase Atual:{" "}
          <Text style={styles.phaseText}>{currentPhaseDisplay}</Text>
        </Text>

        {activeGameSetup.currentPhase !== GameSetupPhase.ROLLING &&
          activeGameSetup.currentPhase !== GameSetupPhase.CHARACTER_CREATION &&
          activeGameSetup.currentPhase !== GameSetupPhase.READY_TO_PLAY && (
            <Text style={styles.currentDefinerText}>
              Vez de:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {currentPlayerDefiningName}
              </Text>
            </Text>
          )}

        <Text style={styles.subHeader}>
          Rolagens ({activeGameSetup.playerRolls?.length || 0} /{" "}
          {activeGameSetup.numPlayersAtSetupStart}):
        </Text>
        {activeGameSetup.playerRolls &&
        activeGameSetup.playerRolls.length > 0 ? (
          activeGameSetup.playerRolls.map((roll, index) => (
            <View
              key={roll.playerId + index}
              style={[styles.playerRollItem, commonStyles.shadow]}
            >
              <Image
                source={{
                  uri: defaultAvatar.replace(
                    "name=P",
                    `name=${encodeURIComponent(roll.playerName[0])}`
                  ),
                }}
                style={styles.avatar}
              />
              <Text style={styles.playerName}>{roll.playerName}: </Text>
              <Text style={styles.rollValue}>{roll.rollValue}</Text>
              {activeGameSetup.interferenceTokens &&
                activeGameSetup.interferenceTokens[roll.playerId] && (
                  <Text style={styles.tokenBadge}>
                    {" "}
                    {activeGameSetup.interferenceTokens[roll.playerId]} Token(s)
                  </Text>
                )}
            </View>
          ))
        ) : (
          <Text style={styles.infoText}>
            Nenhum jogador rolou os dados ainda.
          </Text>
        )}

        {allPlayersRolled &&
          activeGameSetup.currentPhase === GameSetupPhase.ROLLING && (
            <Text style={styles.allRolledText}>
              Todos os jogadores rolaram! Processando atribuições...
            </Text>
          )}

        <View style={[styles.worldDefBox, commonStyles.dashedBorder]}>
          <Text style={styles.worldDefTitle}>Definição do Mundo:</Text>
          <Text style={styles.worldDefItem}>
            Gênero:{" "}
            <Text style={styles.worldDefValue}>
              {activeGameSetup.worldDefinition?.genre?.value || "..."}
            </Text>{" "}
            {activeGameSetup.worldDefinition?.genre?.definedByPlayerName &&
              `(por ${activeGameSetup.worldDefinition.genre.definedByPlayerName})`}
          </Text>
          <Text style={styles.worldDefItem}>
            Adjetivo:{" "}
            <Text style={styles.worldDefValue}>
              {activeGameSetup.worldDefinition?.adjective?.value || "..."}
            </Text>{" "}
            {activeGameSetup.worldDefinition?.adjective?.definedByPlayerName &&
              `(por ${activeGameSetup.worldDefinition.adjective.definedByPlayerName})`}
          </Text>
          <Text style={styles.worldDefItem}>
            Local:{" "}
            <Text style={styles.worldDefValue}>
              {activeGameSetup.worldDefinition?.location?.value || "..."}
            </Text>{" "}
            {activeGameSetup.worldDefinition?.location?.definedByPlayerName &&
              `(por ${activeGameSetup.worldDefinition.location.definedByPlayerName})`}
          </Text>
        </View>

        {activeGameSetup.currentPhase === GameSetupPhase.READY_TO_PLAY && (
          <StyledButton
            onPress={() => {
              /* Logic to start session - future */
            }}
            props_variant="primary"
            style={{ marginTop: 20 }}
            // disabled={!canStartSession} // Add logic based on all players being ready
          >
            Começar Sessão
          </StyledButton>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  phaseText: {
    color: colors.primary,
  },
  currentDefinerText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 15,
    fontStyle: "italic",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  playerRollItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 6,
    marginBottom: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: colors.stone200,
  },
  playerName: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  rollValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  tokenBadge: {
    marginLeft: "auto",
    backgroundColor: colors.secondary,
    color: colors.secondaryContrast,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  allRolledText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
  },
  worldDefBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.stone100,
    borderRadius: 8,
    borderColor: colors.divider,
  },
  worldDefTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 5,
  },
  worldDefItem: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  worldDefValue: {
    fontWeight: "bold",
    color: colors.textPrimary,
  },
});

export default GMGameSetupMonitorScreen;
