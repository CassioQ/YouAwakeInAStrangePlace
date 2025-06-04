import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import StyledButton from "../../components/StyledButton";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { GameSetupPhase } from "../../models/enums/CommomEnuns";
import { PlayerRoll } from "../../models/GameServer.types";
import {
  listenToGameSetup,
  submitPlayerRoll,
} from "../../services/firebaseServices";
import { Unsubscribe } from "firebase/firestore";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";

const GameSetupScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [rollingDice, setRollingDice] = useState(false);
  const [playerHasRolled, setPlayerHasRolled] = useState(false);
  const [myRoll, setMyRoll] = useState<number | null>(null);

  if (!context) return null;
  const {
    currentUser,
    activeServerDetails,
    activeGameSetup,
    setActiveGameSetup,
    navigateTo, // For future navigation from this screen
  } = context;

  useEffect(() => {
    let unsubscribeGameSetup: Unsubscribe | undefined;
    if (activeServerDetails?.id) {
      unsubscribeGameSetup = listenToGameSetup(
        activeServerDetails.id,
        (setupData) => {
          setActiveGameSetup(setupData || null);
          if (setupData?.playerRolls && currentUser) {
            const foundRoll = setupData.playerRolls.find(
              (pr) => pr.playerId === currentUser.uid
            );
            if (foundRoll) {
              setPlayerHasRolled(true);
              setMyRoll(foundRoll.rollValue);
            }
          }
        }
      );
    }
    return () => {
      if (unsubscribeGameSetup) unsubscribeGameSetup();
    };
  }, [activeServerDetails?.id, setActiveGameSetup, currentUser]);

  const handleDiceRoll = async () => {
    if (!currentUser || !activeServerDetails?.id || playerHasRolled) return;

    setRollingDice(true);
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = roll1 + roll2;
    setMyRoll(totalRoll);

    try {
      await submitPlayerRoll(
        activeServerDetails.id,
        currentUser.uid,
        currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Jogador Anônimo",
        totalRoll
      );
      setPlayerHasRolled(true);
      // Alert.alert("Você Rolou!", `Seu resultado: ${totalRoll} (${roll1} + ${roll2})`);
    } catch (error: any) {
      Alert.alert("Erro ao Enviar Rolagem", error.message);
      setMyRoll(null); // Reset if submission failed
    } finally {
      setRollingDice(false);
    }
  };

  const renderRollsList = () => {
    if (
      !activeGameSetup?.playerRolls ||
      activeGameSetup.playerRolls.length === 0
    ) {
      return <Text style={styles.infoText}>Ninguém rolou os dados ainda.</Text>;
    }
    return activeGameSetup.playerRolls.map((roll, index) => (
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
    ));
  };

  if (!activeGameSetup) {
    return (
      <ScreenWrapper title="CONFIGURAÇÃO DO JOGO">
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando configuração...</Text>
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
    <ScreenWrapper title="CONFIGURAÇÃO DO JOGO">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerText}>Fase: Rolagem de Dados</Text>

        {!playerHasRolled && (
          <StyledButton
            onPress={handleDiceRoll}
            disabled={rollingDice || playerHasRolled}
            props_variant="primary"
            style={styles.rollButton}
          >
            {rollingDice ? "Rolando..." : "Rolar Dados (2d6)"}
          </StyledButton>
        )}

        {myRoll !== null && (
          <Text style={styles.myRollText}>Sua rolagem: {myRoll}</Text>
        )}

        {playerHasRolled && !allPlayersRolled && (
          <Text style={styles.waitingText}>
            Aguardando outros jogadores rolarem os dados...
          </Text>
        )}

        {allPlayersRolled && (
          <Text style={styles.allRolledText}>
            Todos os jogadores rolaram! Processando...
          </Text>
          // TODO: Next phase logic will go here
        )}

        <Text style={styles.rollsHeader}>Rolagens Atuais:</Text>
        <View style={styles.rollsContainer}>{renderRollsList()}</View>

        {/* Placeholder for next steps */}
        {activeGameSetup.currentPhase !== GameSetupPhase.ROLLING && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.infoText}>
              Próxima fase: {activeGameSetup.currentPhase}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
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
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  rollButton: {
    marginBottom: 20,
    minWidth: 200,
  },
  myRollText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 10,
  },
  waitingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
  },
  allRolledText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  rollsHeader: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  rollsContainer: {
    width: "100%",
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    padding: 10,
  },
  playerRollItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.stone100,
    borderRadius: 4,
    marginBottom: 6,
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
    textAlign: "center",
  },
});

export default GameSetupScreen;
