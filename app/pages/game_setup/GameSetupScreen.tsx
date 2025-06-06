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
import StyledTextarea from "../../components/StyledTextarea";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { GameSetupPhase, ScreenEnum } from "../../models/enums/CommomEnuns";
import {
  PlayerRoll,
  DefinedSkill,
  PlayerConceptEntry,
} from "../../models/GameServer.types";
import {
  listenToGameSetup,
  submitPlayerRoll,
  submitWorldDefinitionPart,
  submitWorldTruth,
  submitCharacterConcept,
  submitSkillRoll,
  addPlayerSkill,
  removePlayerSkill,
  finalizePlayerSkills,
} from "../../services/firebaseServices";
import { Unsubscribe } from "firebase/firestore";
import { showAppAlert } from "../../utils/alertUtils";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";

const GameSetupScreen: React.FC = () => {
  const context = useContext(AppContext);

  // States for initial rolling phase
  const [rollingDice, setRollingDice] = useState(false);
  const [playerHasRolled, setPlayerHasRolled] = useState(false); // For initial world setup rolls
  const [myRoll, setMyRoll] = useState<number | null>(null);

  // States for world definition phase
  const [definitionInput, setDefinitionInput] = useState("");
  const [submittingDefinition, setSubmittingDefinition] = useState(false);

  // States for truth definition phase
  const [truthInput, setTruthInput] = useState("");
  const [submittingTruth, setSubmittingTruth] = useState(false);

  // States for character concept phase
  const [conceptInput, setConceptInput] = useState("");
  const [submittingConcept, setSubmittingConcept] = useState(false);
  const [playerHasSubmittedConcept, setPlayerHasSubmittedConcept] =
    useState(false);

  // States for skill dice roll phase
  const [rollingSkillDice, setRollingSkillDice] = useState(false);
  const [playerHasRolledSkillDice, setPlayerHasRolledSkillDice] =
    useState(false);
  const [mySkillRoll, setMySkillRoll] = useState<number | null>(null);

  // States for player skill definition phase
  const [skillNameInput, setSkillNameInput] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [removingSkillName, setRemovingSkillName] = useState<string | null>(
    null
  );
  const [finalizingSkills, setFinalizingSkills] = useState(false);

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
    if (activeServerDetails?.id && currentUser) {
      unsubscribeGameSetup = listenToGameSetup(
        activeServerDetails.id,
        (setupData) => {
          setActiveGameSetup(setupData || null);
          if (setupData?.playerRolls) {
            // Initial rolls
            const foundRoll = setupData.playerRolls.find(
              (pr) => pr.playerId === currentUser.uid
            );
            setPlayerHasRolled(!!foundRoll);
            setMyRoll(foundRoll?.rollValue || null);
          }
          if (setupData?.characterConcepts) {
            const myConceptEntry = setupData.characterConcepts.find(
              (c) => c.playerId === currentUser.uid
            );
            setPlayerHasSubmittedConcept(myConceptEntry?.submitted || false);
            if (myConceptEntry?.submitted && !conceptInput)
              setConceptInput(myConceptEntry.concept);
          }
          if (setupData?.skillRolls) {
            const foundSkillRoll = setupData.skillRolls.find(
              (pr) => pr.playerId === currentUser.uid
            );
            setPlayerHasRolledSkillDice(!!foundSkillRoll);
            setMySkillRoll(foundSkillRoll?.rollValue || null);
          }
        }
      );
    }
    return () => {
      if (unsubscribeGameSetup) unsubscribeGameSetup();
    };
  }, [activeServerDetails?.id, setActiveGameSetup, currentUser, conceptInput]); // Added conceptInput

  const handleInitialDiceRoll = async () => {
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
      showAppAlert("Erro", error.message);
    } finally {
      setSubmittingDefinition(false);
    }
  };

  const handleSubmitTruth = async () => {
    if (
      !currentUser ||
      !activeServerDetails?.id ||
      !activeGameSetup ||
      !truthInput.trim()
    )
      return;
    if (
      activeGameSetup.currentPlayerIdToDefine !== currentUser.uid ||
      activeGameSetup.currentPhase !== GameSetupPhase.DEFINING_TRUTHS
    ) {
      showAppAlert(
        "Atenção",
        "Não é sua vez de definir uma verdade ou fase incorreta."
      );
      return;
    }
    setSubmittingTruth(true);
    try {
      await submitWorldTruth(
        activeServerDetails.id,
        currentUser.uid,
        currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Jogador Anônimo",
        truthInput
      );
      setTruthInput("");
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setSubmittingTruth(false);
    }
  };

  const handleSubmitConcept = async () => {
    if (
      !currentUser ||
      !activeServerDetails?.id ||
      !activeGameSetup ||
      !conceptInput.trim()
    )
      return;
    if (playerHasSubmittedConcept) {
      showAppAlert("Info", "Você já submeteu seu conceito.");
      return;
    }
    setSubmittingConcept(true);
    try {
      await submitCharacterConcept(
        activeServerDetails.id,
        currentUser.uid,
        conceptInput
      );
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setSubmittingConcept(false);
    }
  };

  const handleSkillDiceRoll = async () => {
    if (!currentUser || !activeServerDetails?.id || playerHasRolledSkillDice)
      return;
    setRollingSkillDice(true);
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = roll1 + roll2;
    try {
      await submitSkillRoll(
        activeServerDetails.id,
        currentUser.uid,
        currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Jogador Anônimo",
        totalRoll
      );
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setRollingSkillDice(false);
    }
  };

  const handleAddSkill = async () => {
    if (!currentUser || !activeServerDetails?.id || !skillNameInput.trim())
      return;
    setAddingSkill(true);
    try {
      await addPlayerSkill(
        activeServerDetails.id,
        currentUser.uid,
        currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Jogador Anônimo",
        skillNameInput
      );
      setSkillNameInput("");
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillNameToRemove: string) => {
    if (!currentUser || !activeServerDetails?.id) return;
    setRemovingSkillName(skillNameToRemove);
    try {
      await removePlayerSkill(
        activeServerDetails.id,
        currentUser.uid,
        skillNameToRemove
      );
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setRemovingSkillName(null);
    }
  };

  const handleFinalizePlayerSkills = async () => {
    if (!currentUser || !activeServerDetails?.id) return;
    setFinalizingSkills(true);
    try {
      await finalizePlayerSkills(activeServerDetails.id, currentUser.uid);
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setFinalizingSkills(false);
    }
  };

  // --- RENDER HELPER FUNCTIONS ---
  const getPlayerNameById = (playerId: string): string => {
    const player = activeServerDetails?.players.find(
      (p) => p.userId === playerId
    );
    return player?.playerName || "Jogador Desconhecido";
  };

  const renderRollsList = (rolls: PlayerRoll[], title: string) => (
    <>
      <Text style={styles.rollsHeader}>{title}</Text>
      {(!rolls || rolls.length === 0) && (
        <Text style={styles.infoText}>Nenhuma rolagem ainda.</Text>
      )}
      <View style={styles.rollsContainer}>
        {rolls.map((roll, index) => (
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
        ))}
      </View>
    </>
  );

  // --- RENDER PHASE SECTIONS ---
  const renderInitialRollingPhase = () => (
    <>
      <Text style={styles.headerText}>
        Fase: Rolagem de Dados (Definição do Mundo)
      </Text>
      {!playerHasRolled && (
        <StyledButton
          onPress={handleInitialDiceRoll}
          disabled={rollingDice}
          props_variant="primary"
          style={styles.actionButton}
        >
          {rollingDice ? "Rolando..." : "Rolar Dados (2d6)"}
        </StyledButton>
      )}
      {myRoll !== null && (
        <Text style={styles.myRollText}>Sua rolagem inicial: {myRoll}</Text>
      )}
      {playerHasRolled && !allPlayersHaveRolledInitial && (
        <Text style={styles.waitingText}>
          Aguardando outros jogadores rolarem...
        </Text>
      )}
      {allPlayersHaveRolledInitial && (
        <Text style={styles.allRolledText}>
          Todos rolaram para definição do mundo!
        </Text>
      )}
      {renderRollsList(
        activeGameSetup?.playerRolls || [],
        "Rolagens Atuais (Mundo):"
      )}
    </>
  );

  const renderWorldDefinitionPhase = () => {
    if (!activeGameSetup || !currentUser) return null;
    const { currentPhase, currentPlayerIdToDefine, worldDefinition } =
      activeGameSetup;
    const isMyTurnToDefine = currentPlayerIdToDefine === currentUser.uid;
    const currentDefinerName = currentPlayerIdToDefine
      ? getPlayerNameById(currentPlayerIdToDefine)
      : "próximo jogador";
    let phaseTitle = "",
      inputLabel = "",
      placeholder = "";

    if (currentPhase === GameSetupPhase.DEFINING_GENRE) {
      phaseTitle = "Definindo Gênero";
      inputLabel = "Gênero do Mundo";
      placeholder = "Ex: Faroeste";
    } else if (currentPhase === GameSetupPhase.DEFINING_ADJECTIVE) {
      phaseTitle = "Definindo Adjetivo";
      inputLabel = "Adjetivo";
      placeholder = "Ex: Perigoso";
    } else if (currentPhase === GameSetupPhase.DEFINING_LOCATION) {
      phaseTitle = "Definindo Local";
      inputLabel = "Local Principal";
      placeholder = "Ex: Escola";
    } else return null;

    return (
      <View style={styles.phaseContainer}>
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
              style={styles.actionButton}
            >
              {submittingDefinition ? "Enviando..." : "Submeter Definição"}
            </StyledButton>
          </>
        ) : (
          <Text style={styles.waitingText}>
            Aguardando {currentDefinerName} definir...
          </Text>
        )}
      </View>
    );
  };

  const renderTruthDefinitionPhase = () => {
    if (!activeGameSetup || !currentUser) return null;
    const { currentPlayerIdToDefine, worldTruths } = activeGameSetup;
    const isMyTurnToDefineTruth = currentPlayerIdToDefine === currentUser.uid;
    const currentTruthDefinerName = currentPlayerIdToDefine
      ? getPlayerNameById(currentPlayerIdToDefine)
      : "próximo jogador";

    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.headerText}>Definindo Verdades do Mundo</Text>
        <Text style={styles.promptText}>
          Converse com os outros jogadores e o Mestre para definir uma Verdade
          sobre este mundo.
        </Text>
        {worldTruths && worldTruths.length > 0 && (
          <View style={styles.truthsList}>
            <Text style={styles.subHeaderText}>Verdades Definidas:</Text>
            {worldTruths.map((truth, index) => (
              <Text key={index} style={styles.truthItem}>
                {truth.order}. {truth.truth} (por {truth.definedByPlayerName})
              </Text>
            ))}
          </View>
        )}
        {isMyTurnToDefineTruth ? (
          <>
            <StyledTextarea
              label="Sua Verdade sobre o Mundo"
              value={truthInput}
              onChangeText={setTruthInput}
              placeholder="Ex: A principal ameaça são Ciber-Aranhas."
              rows={3}
              containerStyle={{ width: "100%", marginVertical: 10 }}
              autoFocus
            />
            <StyledButton
              onPress={handleSubmitTruth}
              disabled={submittingTruth || !truthInput.trim()}
              props_variant="primary"
              style={styles.actionButton}
            >
              {submittingTruth ? "Enviando..." : "Submeter Verdade"}
            </StyledButton>
          </>
        ) : (
          <Text style={styles.waitingText}>
            Aguardando {currentTruthDefinerName} definir uma Verdade...
          </Text>
        )}
      </View>
    );
  };

  const renderCharacterConceptPhase = () => {
    if (!activeGameSetup || !currentUser || !activeGameSetup.characterConcepts)
      return null;
    const myConceptEntry = activeGameSetup.characterConcepts.find(
      (c) => c.playerId === currentUser.uid
    );

    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.headerText}>Definindo Conceito do Personagem</Text>
        <Text style={styles.promptText}>
          Descreva que tipo de personagem você quer ser. Não se preocupe com
          detalhes ainda, apenas o conceito geral.
        </Text>
        {!myConceptEntry?.submitted ? (
          <>
            <StyledTextarea
              label="Seu Conceito de Personagem"
              value={conceptInput}
              onChangeText={setConceptInput}
              placeholder="Ex: Um detetive cibernético amargurado, um mago exilado buscando redenção, etc."
              rows={4}
              containerStyle={{ width: "100%", marginVertical: 10 }}
              autoFocus
            />
            <StyledButton
              onPress={handleSubmitConcept}
              disabled={submittingConcept || !conceptInput.trim()}
              props_variant="primary"
              style={styles.actionButton}
            >
              {submittingConcept ? "Enviando..." : "Submeter Conceito"}
            </StyledButton>
          </>
        ) : (
          <Text style={styles.infoText}>
            Seu conceito foi submetido! Aguardando outros jogadores...
          </Text>
        )}

        <View style={styles.conceptsList}>
          <Text style={styles.subHeaderText}>Conceitos Submetidos:</Text>
          {activeGameSetup.characterConcepts
            .filter((c) => c.submitted)
            .map((c) => (
              <Text key={c.playerId} style={styles.listItemText}>
                {c.playerName}: {c.concept}
              </Text>
            ))}
          {activeGameSetup.characterConcepts.filter((c) => !c.submitted)
            .length > 0 && (
            <Text style={styles.infoTextItalic}>
              Aguardando{" "}
              {
                activeGameSetup.characterConcepts.filter((c) => !c.submitted)
                  .length
              }{" "}
              jogador(es)...
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderSkillDiceRollPhase = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.headerText}>
        Fase: Rolagem de Dados (Ordem de Habilidades)
      </Text>
      <Text style={styles.promptText}>
        Role 2d6 para determinar a ordem de escolha das habilidades.
      </Text>
      {!playerHasRolledSkillDice && (
        <StyledButton
          onPress={handleSkillDiceRoll}
          disabled={rollingSkillDice}
          props_variant="primary"
          style={styles.actionButton}
        >
          {rollingSkillDice
            ? "Rolando..."
            : "Rolar Dados para Habilidades (2d6)"}
        </StyledButton>
      )}
      {mySkillRoll !== null && (
        <Text style={styles.myRollText}>
          Sua rolagem para habilidades: {mySkillRoll}
        </Text>
      )}
      {playerHasRolledSkillDice && !activeGameSetup?.allSkillRollsSubmitted && (
        <Text style={styles.waitingText}>
          Aguardando outros jogadores rolarem para habilidades...
        </Text>
      )}
      {activeGameSetup?.allSkillRollsSubmitted && (
        <Text style={styles.allRolledText}>
          Todos rolaram para habilidades!
        </Text>
      )}
      {renderRollsList(
        activeGameSetup?.skillRolls || [],
        "Rolagens (Habilidades):"
      )}
    </View>
  );

  const renderPlayerSkillDefinitionPhase = () => {
    if (
      !activeGameSetup ||
      !currentUser ||
      !activeGameSetup.skillsPerPlayerAllocation ||
      !activeGameSetup.definedSkills ||
      !activeGameSetup.skillRolls
    )
      return null;
    const myAllocation =
      activeGameSetup.skillsPerPlayerAllocation[currentUser.uid];
    const isMyTurnToDefineSkills =
      activeGameSetup.currentPlayerIdToDefine === currentUser.uid;
    const currentSkillDefinerName = activeGameSetup.currentPlayerIdToDefine
      ? getPlayerNameById(activeGameSetup.currentPlayerIdToDefine)
      : "Ninguém";

    if (!myAllocation)
      return (
        <Text style={styles.errorText}>
          Erro: Alocação de habilidades não encontrada.
        </Text>
      );
    const skillsIDefined = activeGameSetup.definedSkills.filter(
      (s) => s.definedByPlayerId === currentUser.uid && s.type === "player"
    );

    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.headerText}>Definindo Habilidades</Text>
        {isMyTurnToDefineSkills && !myAllocation.finalized ? (
          <>
            <Text style={styles.promptText}>
              Sua vez! Defina {myAllocation.totalToDefine} habilidade(s). Você
              já definiu {skillsIDefined.length}.
            </Text>
            {skillsIDefined.length < myAllocation.totalToDefine ? (
              <>
                <StyledInput
                  label="Nome da Habilidade"
                  value={skillNameInput}
                  onChangeText={setSkillNameInput}
                  placeholder="Ex: Investigar, Lutar, Persuadir"
                  containerStyle={{ width: "100%", marginVertical: 10 }}
                />
                <StyledButton
                  onPress={handleAddSkill}
                  disabled={addingSkill || !skillNameInput.trim()}
                  props_variant="primary"
                  style={styles.actionButtonSmall}
                >
                  Adicionar Habilidade
                </StyledButton>
              </>
            ) : (
              <Text style={styles.infoTextGreen}>
                Você definiu todas as suas habilidades!
              </Text>
            )}
            <View style={styles.mySkillsList}>
              <Text style={styles.subHeaderText}>
                Suas Habilidades Adicionadas:
              </Text>
              {skillsIDefined.map((skill) => (
                <View key={skill.skillName} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill.skillName}</Text>
                  <StyledButton
                    onPress={() => handleRemoveSkill(skill.skillName)}
                    disabled={removingSkillName === skill.skillName}
                    props_variant="secondary"
                    style={styles.removeSkillButton}
                    textStyle={styles.removeSkillButtonText}
                  >
                    X
                  </StyledButton>
                </View>
              ))}
            </View>
            {skillsIDefined.length >= myAllocation.totalToDefine && (
              <StyledButton
                onPress={handleFinalizePlayerSkills}
                disabled={finalizingSkills}
                props_variant="primary"
                style={styles.actionButton}
              >
                {finalizingSkills
                  ? "Finalizando..."
                  : "Finalizar Minhas Habilidades"}
              </StyledButton>
            )}
          </>
        ) : (
          <Text style={styles.waitingText}>
            Aguardando{" "}
            {myAllocation.finalized
              ? "outros jogadores"
              : currentSkillDefinerName}{" "}
            definir habilidades...
          </Text>
        )}
        <View style={styles.definedSkillsList}>
          <Text style={styles.subHeaderText}>
            Todas Habilidades Definidas (
            {
              activeGameSetup.definedSkills.filter((s) => s.type === "player")
                .length
            }
            /12 por jogadores):
          </Text>
          {activeGameSetup.definedSkills
            .filter((s) => s.type === "player")
            .map((skill, idx) => (
              <Text key={idx} style={styles.listItemText}>
                {skill.skillName} (por {skill.definedByPlayerName})
              </Text>
            ))}
        </View>
      </View>
    );
  };

  // --- MAIN RENDER LOGIC ---
  if (!activeGameSetup) {
    return (
      <ScreenWrapper title="CONFIGURAÇÃO DO JOGO">
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const allPlayersHaveRolledInitial =
    activeGameSetup.playerRolls &&
    activeGameSetup.numPlayersAtSetupStart > 0 &&
    activeGameSetup.playerRolls.length ===
      activeGameSetup.numPlayersAtSetupStart;

  const myTokens =
    currentUser && activeGameSetup.interferenceTokens?.[currentUser.uid];

  let content = null;
  switch (activeGameSetup.currentPhase) {
    case GameSetupPhase.ROLLING:
      content = renderInitialRollingPhase();
      break;
    case GameSetupPhase.DEFINING_GENRE:
    case GameSetupPhase.DEFINING_ADJECTIVE:
    case GameSetupPhase.DEFINING_LOCATION:
      content = renderWorldDefinitionPhase();
      break;
    case GameSetupPhase.DEFINING_TRUTHS:
      content = renderTruthDefinitionPhase();
      break;
    case GameSetupPhase.DEFINING_CHARACTER_CONCEPTS:
      content = renderCharacterConceptPhase();
      break;
    case GameSetupPhase.SKILL_DICE_ROLL:
      content = renderSkillDiceRollPhase();
      break;
    case GameSetupPhase.DEFINING_PLAYER_SKILLS:
      content = renderPlayerSkillDefinitionPhase();
      break;
    case GameSetupPhase.DEFINING_GM_SKILLS:
      content = (
        <Text style={styles.waitingText}>
          Aguardando o Mestre definir as últimas habilidades...
        </Text>
      );
      break;
    case GameSetupPhase.AWAITING_GAME_START:
      content = (
        <Text style={styles.infoTextGreen}>
          Tudo pronto! Aguardando o Mestre iniciar a sessão de jogo.
        </Text>
      );
      break;
    default:
      content = <Text style={styles.infoText}>Fase desconhecida.</Text>;
  }

  return (
    <ScreenWrapper title="CONFIGURAÇÃO DO JOGO" childHandlesScrolling={true}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {content}
        {myTokens !== undefined && myTokens && myTokens > 0 && (
          <Text style={styles.tokenText}>
            Você tem {myTokens} token(s) de interferência!
          </Text>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingBottom: 30,
    alignItems: "center",
  },
  phaseContainer: {
    // Used for each phase's content block
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.backgroundPaper,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    ...commonStyles.shadow,
  },
  centeredMessage: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 15,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 5,
  },
  promptText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  actionButton: { marginBottom: 15, minWidth: 220 },
  actionButtonSmall: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 38,
  },
  myRollText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  waitingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 15,
  },
  allRolledText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: 10,
  },
  infoTextGreen: {
    fontSize: 16,
    color: colors.success,
    fontWeight: "500",
    textAlign: "center",
    marginVertical: 10,
  },
  infoTextItalic: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 5,
  },

  rollsHeader: {
    fontSize: 17,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 15,
    marginBottom: 8,
    alignSelf: "flex-start",
    width: "100%",
  },
  rollsContainer: {
    width: "100%",
    backgroundColor: colors.stone100,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  playerRollItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: 4,
    marginBottom: 5,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: colors.stone200,
  },
  playerName: { fontSize: 15, color: colors.textSecondary },
  rollValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginLeft: "auto",
  },

  worldInfoBox: {
    width: "100%",
    padding: 10,
    backgroundColor: colors.stone100,
    borderRadius: 6,
    marginBottom: 15,
  },
  worldInfoText: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },

  truthsList: { width: "100%", marginBottom: 15, paddingHorizontal: 5 },
  truthItem: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 5,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  conceptsList: {
    width: "100%",
    marginTop: 15,
    padding: 10,
    backgroundColor: colors.stone100,
    borderRadius: 6,
  },
  listItemText: { fontSize: 14, color: colors.textPrimary, marginBottom: 4 },

  mySkillsList: {
    width: "100%",
    marginVertical: 15,
    padding: 10,
    backgroundColor: colors.stone50,
    borderRadius: 6,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginBottom: 6,
  },
  skillChipText: {
    color: colors.secondaryContrast,
    fontSize: 15,
    fontWeight: "500",
  },
  removeSkillButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 0,
    backgroundColor: colors.error,
    marginLeft: 8,
  },
  removeSkillButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "bold",
  },
  definedSkillsList: {
    width: "100%",
    marginTop: 20,
    padding: 10,
    backgroundColor: colors.stone100,
    borderRadius: 6,
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
