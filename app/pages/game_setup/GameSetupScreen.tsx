import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import StyledButton from "../../components/StyledButton";
import StyledInput from "../../components/StyledInput";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { GameSetupPhase, ScreenEnum } from "../../models/enums/CommomEnuns"; // Added ScreenEnum import
import { PlayerRoll } from "../../models/GameServer.types";
import {
  listenToGameSetup,
  submitPlayerRoll,
  submitWorldDefinitionPart,
} from "../../services/firebaseServices";
import { Unsubscribe } from "firebase/firestore";
import { showAppAlert } from "../../utils/alertUtils";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";

const GameSetupScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [rollingDice, setRollingDice] = useState(false);
  const [playerHasRolled, setPlayerHasRolled] = useState(false);
  const [myRoll, setMyRoll] = useState<number | null>(null);
  const [definitionInput, setDefinitionInput] = useState("");
  const [submittingDefinition, setSubmittingDefinition] = useState(false);

  if (!context) return null;
  const {
    currentUser,
    activeServerDetails,
    activeGameSetup,
    setActiveGameSetup,
    navigateTo,
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
            } else {
              setPlayerHasRolled(false);
              setMyRoll(null);
            }
          }
          if (setupData?.currentPhase === GameSetupPhase.CHARACTER_CREATION) {
            navigateTo(ScreenEnum.CHARACTER_CREATE_THEME);
          }
        }
      );
    }
    return () => {
      if (unsubscribeGameSetup) unsubscribeGameSetup();
    };
  }, [activeServerDetails?.id, setActiveGameSetup, currentUser, navigateTo]);

  const handleDiceRoll = async () => {
    if (!currentUser || !activeServerDetails?.id || playerHasRolled) return;

    setRollingDice(true);
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = roll1 + roll2;

    try {
      await submitPlayerRoll(
        activeServerDetails.id,
        currentUser.uid,
        currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Jogador Anônimo",
        totalRoll
      );
    } catch (error: any) {
      showAppAlert("Erro ao Enviar Rolagem", error.message);
      setMyRoll(null);
    } finally {
      setRollingDice(false);
    }
  };

  const handleSubmitDefinition = async () => {
    if (
      !currentUser ||
      !activeServerDetails?.id ||
      !activeGameSetup ||
      !definitionInput.trim()
    )
      return;
    if (activeGameSetup.currentPlayerIdToDefine !== currentUser.uid) {
      showAppAlert("Atenção", "Não é sua vez de definir.");
      return;
    }

    let definitionType: "genre" | "adjective" | "location" | null = null;
    if (activeGameSetup.currentPhase === GameSetupPhase.DEFINING_GENRE)
      definitionType = "genre";
    else if (activeGameSetup.currentPhase === GameSetupPhase.DEFINING_ADJECTIVE)
      definitionType = "adjective";
    else if (activeGameSetup.currentPhase === GameSetupPhase.DEFINING_LOCATION)
      definitionType = "location";

    if (!definitionType) {
      showAppAlert("Erro", "Fase de definição inválida.");
      return;
    }

    setSubmittingDefinition(true);
    try {
      await submitWorldDefinitionPart(
        activeServerDetails.id,
        currentUser.uid,
        currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Jogador Anônimo",
        definitionType,
        definitionInput
      );
      setDefinitionInput("");
    } catch (error: any) {
      showAppAlert("Erro ao Submeter Definição", error.message);
    } finally {
      setSubmittingDefinition(false);
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

  const getPlayerNameById = (playerId: string): string => {
    const player = activeServerDetails?.players.find(
      (p) => p.userId === playerId
    );
    return player?.playerName || "Jogador Desconhecido";
  };

  const renderDefinitionPhase = () => {
    if (!activeGameSetup || !currentUser) return null;

    const {
      currentPhase,
      currentPlayerIdToDefine,
      worldDefinition,
      definitionOrder,
    } = activeGameSetup;
    const isMyTurnToDefine = currentPlayerIdToDefine === currentUser.uid;
    let currentDefinerName = "";
    if (currentPlayerIdToDefine && definitionOrder) {
      currentDefinerName = getPlayerNameById(currentPlayerIdToDefine);
    }

    let phaseTitle = "";
    let inputLabel = "";
    let placeholder = "";

    if (currentPhase === GameSetupPhase.DEFINING_GENRE) {
      phaseTitle = "Definindo Gênero";
      inputLabel = "Gênero do Mundo";
      placeholder = "Ex: Faroeste, Fantasia";
    } else if (currentPhase === GameSetupPhase.DEFINING_ADJECTIVE) {
      phaseTitle = "Definindo Adjetivo";
      inputLabel = "Adjetivo para o Mundo";
      placeholder = "Ex: Perigoso, Mágico";
    } else if (currentPhase === GameSetupPhase.DEFINING_LOCATION) {
      phaseTitle = "Definindo Local";
      inputLabel = "Local Principal";
      placeholder = "Ex: Uma escola abandonada";
    } else {
      return null;
    }

    return (
      <View style={styles.definitionContainer}>
        <Text style={styles.headerText}>{phaseTitle}</Text>
        <View style={styles.worldInfoBox}>
          <Text style={styles.worldInfoText}>
            Gênero: {worldDefinition.genre?.value || "..."}{" "}
            {worldDefinition.genre?.definedByPlayerName &&
              `(por ${worldDefinition.genre.definedByPlayerName})`}
          </Text>
          <Text style={styles.worldInfoText}>
            Adjetivo: {worldDefinition.adjective?.value || "..."}{" "}
            {worldDefinition.adjective?.definedByPlayerName &&
              `(por ${worldDefinition.adjective.definedByPlayerName})`}
          </Text>
          <Text style={styles.worldInfoText}>
            Local: {worldDefinition.location?.value || "..."}{" "}
            {worldDefinition.location?.definedByPlayerName &&
              `(por ${worldDefinition.location.definedByPlayerName})`}
          </Text>
        </View>

        {isMyTurnToDefine ? (
          <>
            <StyledInput
              label={inputLabel}
              value={definitionInput}
              onChangeText={setDefinitionInput}
              placeholder={placeholder}
              autoFocus
              containerStyle={{ width: "100%" }}
            />
            <StyledButton
              onPress={handleSubmitDefinition}
              disabled={submittingDefinition || !definitionInput.trim()}
              props_variant="primary"
              style={styles.submitButton}
            >
              {submittingDefinition ? "Enviando..." : "Submeter Definição"}
            </StyledButton>
          </>
        ) : (
          <Text style={styles.waitingText}>
            Aguardando {currentDefinerName || "próximo jogador"} definir...
          </Text>
        )}
      </View>
    );
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

  const myTokens =
    currentUser && activeGameSetup.interferenceTokens?.[currentUser.uid];

  return (
    <ScreenWrapper title="CONFIGURAÇÃO DO JOGO" childHandlesScrolling={true}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {activeGameSetup.currentPhase === GameSetupPhase.ROLLING && (
          <>
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
            )}
            <Text style={styles.rollsHeader}>Rolagens Atuais:</Text>
            <View style={styles.rollsContainer}>{renderRollsList()}</View>
          </>
        )}

        {activeGameSetup.currentPhase !== GameSetupPhase.ROLLING &&
          activeGameSetup.currentPhase !== GameSetupPhase.CHARACTER_CREATION &&
          activeGameSetup.currentPhase !== GameSetupPhase.READY_TO_PLAY &&
          renderDefinitionPhase()}

        {myTokens !== undefined && myTokens && myTokens > 0 && (
          <Text style={styles.tokenText}>
            Você tem {myTokens} token(s) de interferência!
          </Text>
        )}

        {activeGameSetup.currentPhase === GameSetupPhase.CHARACTER_CREATION && (
          <Text style={styles.infoText}>
            Hora de criar seu personagem! Você será redirecionado...
          </Text>
        )}
        {activeGameSetup.currentPhase === GameSetupPhase.READY_TO_PLAY && (
          <Text style={styles.infoText}>
            Tudo pronto! Aguardando o Mestre iniciar a sessão.
          </Text>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    // This is now contentContainerStyle for the ScrollView
    paddingBottom: 20, // Ensure space at the bottom if content is long
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
  submitButton: {
    marginTop: 10,
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
    marginTop: 10,
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
    width: "100%", // Ensure header takes width within padded scrollview
  },
  rollsContainer: {
    width: "100%",
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
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
  definitionContainer: {
    width: "100%",
    alignItems: "center",
    padding: 10,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    marginBottom: 20,
  },
  worldInfoBox: {
    width: "100%",
    padding: 10,
    backgroundColor: colors.stone100,
    borderRadius: 6,
    marginBottom: 15,
  },
  worldInfoText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 16,
    color: colors.secondaryContrast,
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
  },
});

export default GameSetupScreen;
