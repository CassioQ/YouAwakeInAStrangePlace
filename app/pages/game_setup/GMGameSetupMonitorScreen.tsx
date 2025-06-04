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
import { PlayerRoll } from "../../models/GameServer.types"; // For PlayerRoll type
import { listenToGameSetup } from "../../services/firebaseServices";
import { Unsubscribe } from "firebase/firestore";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";

const GMGameSetupMonitorScreen: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return null;
  const {
    activeServerDetails,
    activeGameSetup,
    setActiveGameSetup,
    navigateTo, // For future navigation
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

  return (
    <ScreenWrapper title={`MONITOR: ${activeServerDetails.serverName}`}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerText}>
          Fase Atual:{" "}
          <Text style={styles.phaseText}>
            {activeGameSetup.currentPhase === GameSetupPhase.ROLLING &&
              "Rolagem de Dados"}
            {activeGameSetup.currentPhase === GameSetupPhase.DEFINING_GENRE &&
              "Definindo Gênero"}
            {activeGameSetup.currentPhase ===
              GameSetupPhase.DEFINING_ADJECTIVE && "Definindo Adjetivo"}
            {activeGameSetup.currentPhase ===
              GameSetupPhase.DEFINING_LOCATION && "Definindo Local"}
            {activeGameSetup.currentPhase ===
              GameSetupPhase.CHARACTER_CREATION && "Criação de Personagens"}
            {activeGameSetup.currentPhase === GameSetupPhase.READY_TO_PLAY &&
              "Pronto para Jogar"}
          </Text>
        </Text>

        <Text style={styles.subHeader}>
          Jogadores que já rolaram ({activeGameSetup.playerRolls?.length || 0} /{" "}
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
              Todos os jogadores rolaram! Processando...
            </Text>
          )}

        {/* Placeholder for displaying world definition and other setup details */}
        <View style={styles.worldDefBox}>
          <Text style={styles.worldDefTitle}>Definição do Mundo:</Text>
          <Text>
            Gênero: {activeGameSetup.worldDefinition?.genre?.value || "..."}{" "}
            (Por:{" "}
            {activeGameSetup.worldDefinition?.genre?.definedByPlayerName ||
              "N/A"}
            )
          </Text>
          <Text>
            Adjetivo:{" "}
            {activeGameSetup.worldDefinition?.adjective?.value || "..."} (Por:{" "}
            {activeGameSetup.worldDefinition?.adjective?.definedByPlayerName ||
              "N/A"}
            )
          </Text>
          <Text>
            Local: {activeGameSetup.worldDefinition?.location?.value || "..."}{" "}
            (Por:{" "}
            {activeGameSetup.worldDefinition?.location?.definedByPlayerName ||
              "N/A"}
            )
          </Text>
        </View>

        {/* (Future) Button for GM to start session when currentPhase is 'ready_to_play' */}
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
    marginLeft: "auto",
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
  },
  worldDefTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: colors.textPrimary,
  },
});

export default GMGameSetupMonitorScreen;
