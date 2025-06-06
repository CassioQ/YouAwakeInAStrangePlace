import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
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
  PlayerSkillModifierChoice,
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
  assignPlayerSkillModifier, // Added
  finalizePlayerSkillModifiers, // Added
} from "../../services/firebaseServices";
import { Unsubscribe } from "firebase/firestore";
import { showAppAlert } from "../../utils/alertUtils";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";
const MODIFIER_VALUES = [
  { label: "Incrível", value: 2 },
  { label: "Bom", value: 1 },
  { label: "Ruim", value: -1 },
  { label: "Horrível", value: -2 },
];

const TOTAL_PLAYER_SKILLS = 12; // Define the constant

const GameSetupScreen: React.FC = () => {
  const context = useContext(AppContext);

  // States for initial rolling phase
  const [rollingDice, setRollingDice] = useState(false);
  const [playerHasRolled, setPlayerHasRolled] = useState(false);
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

  // States for skill modifier assignment phase
  const [selectedModifierValue, setSelectedModifierValue] = useState<
    number | null
  >(null);
  const [assigningModifier, setAssigningModifier] = useState(false);
  const [finalizingModifiers, setFinalizingModifiers] = useState(false);

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
          // Reset selected modifier if phase changes or player status changes
          if (
            setupData?.currentPhase !==
              GameSetupPhase.ASSIGNING_SKILL_MODIFIERS ||
            (setupData?.playerModifierSelectionStatus &&
              setupData.playerModifierSelectionStatus[currentUser.uid]
                ?.finalized)
          ) {
            setSelectedModifierValue(null);
          }
        }
      );
    }
    return () => {
      if (unsubscribeGameSetup) unsubscribeGameSetup();
    };
  }, [activeServerDetails?.id, setActiveGameSetup, currentUser, conceptInput]);

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

  const handleAssignSkillModifier = async (skillName: string) => {
    if (
      !currentUser ||
      !activeServerDetails?.id ||
      selectedModifierValue === null
    ) {
      showAppAlert("Atenção", "Selecione um modificador primeiro.");
      return;
    }
    setAssigningModifier(true);
    try {
      await assignPlayerSkillModifier(
        activeServerDetails.id,
        currentUser.uid,
        skillName,
        selectedModifierValue
      );
      setSelectedModifierValue(null); // Reset after assigning
    } catch (error: any) {
      showAppAlert("Erro ao Atribuir", error.message);
    } finally {
      setAssigningModifier(false);
    }
  };

  const handleFinalizeSkillModifiers = async () => {
    if (!currentUser || !activeServerDetails?.id) return;
    setFinalizingModifiers(true);
    try {
      await finalizePlayerSkillModifiers(
        activeServerDetails.id,
        currentUser.uid
      );
    } catch (error: any) {
      showAppAlert("Erro ao Finalizar", error.message);
    } finally {
      setFinalizingModifiers(false);
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
    let phaseTitle = "";
    let placeholderText = "";

    if (currentPhase === GameSetupPhase.DEFINING_GENRE) {
      phaseTitle = "Definir Gênero";
      placeholderText = "Ex: Faroeste, Ficção Científica, Fantasia Medieval";
    } else if (currentPhase === GameSetupPhase.DEFINING_ADJECTIVE) {
      phaseTitle = "Definir Adjetivo";
      placeholderText = "Ex: Perigoso, Mágico, Desolado";
    } else if (currentPhase === GameSetupPhase.DEFINING_LOCATION) {
      phaseTitle = "Definir Local";
      placeholderText = "Ex: Escola, Caverna, Nave Espacial";
    }

    const isMyTurnToDefine = currentPlayerIdToDefine === currentUser.uid;

    return (
      <>
        <Text style={styles.headerText}>Fase: {phaseTitle}</Text>
        <View style={styles.worldDefDisplay}>
          <Text style={styles.worldDefText}>
            Gênero:{" "}
            <Text style={styles.worldDefValue}>
              {worldDefinition.genre?.value || "..."} (
              {worldDefinition.genre?.definedByPlayerName || "A definir"})
            </Text>
          </Text>
          <Text style={styles.worldDefText}>
            Adjetivo:{" "}
            <Text style={styles.worldDefValue}>
              {worldDefinition.adjective?.value || "..."} (
              {worldDefinition.adjective?.definedByPlayerName || "A definir"})
            </Text>
          </Text>
          <Text style={styles.worldDefText}>
            Local:{" "}
            <Text style={styles.worldDefValue}>
              {worldDefinition.location?.value || "..."} (
              {worldDefinition.location?.definedByPlayerName || "A definir"})
            </Text>
          </Text>
        </View>
        {isMyTurnToDefine ? (
          <>
            <StyledInput
              label={`Sua vez de ${phaseTitle.toLowerCase()}`}
              value={definitionInput}
              onChangeText={setDefinitionInput}
              placeholder={placeholderText}
              autoFocus
              containerStyle={{ width: "100%" }}
            />
            <StyledButton
              onPress={handleSubmitDefinition}
              disabled={submittingDefinition || !definitionInput.trim()}
              props_variant="primary"
              style={styles.actionButton}
            >
              {submittingDefinition ? "Enviando..." : "Enviar Definição"}
            </StyledButton>
          </>
        ) : (
          <Text style={styles.waitingText}>
            Aguardando {getPlayerNameById(currentPlayerIdToDefine || "")}{" "}
            definir...
          </Text>
        )}
      </>
    );
  };

  const renderTruthDefinitionPhase = () => {
    if (!activeGameSetup || !currentUser) return null;
    const { currentPlayerIdToDefine, worldTruths, definitionOrder } =
      activeGameSetup;
    const isMyTurnToDefineTruth = currentPlayerIdToDefine === currentUser.uid;
    const currentPlayerIndex =
      definitionOrder?.indexOf(currentPlayerIdToDefine || "") ?? -1;
    const truthNumber = (activeGameSetup.currentPlayerTruthIndex ?? 0) + 1;

    return (
      <>
        <Text style={styles.headerText}>
          Fase: Definindo Verdades ({truthNumber}/{definitionOrder?.length})
        </Text>
        {worldTruths && worldTruths.length > 0 && (
          <View style={styles.truthsDisplay}>
            <Text style={styles.subHeaderText}>Verdades Já Definidas:</Text>
            {worldTruths.map((truth, idx) => (
              <Text key={idx} style={styles.truthItem}>
                {truth.order}. {truth.truth} (por {truth.definedByPlayerName})
              </Text>
            ))}
          </View>
        )}
        <Text style={styles.infoTextSmall}>
          Converse com os outros jogadores e com o mestre para definir algo
          interessante sobre o mundo!
        </Text>
        {isMyTurnToDefineTruth ? (
          <>
            <StyledTextarea
              label={`Sua vez de definir a ${truthNumber}ª verdade`}
              value={truthInput}
              onChangeText={setTruthInput}
              placeholder="Ex: Neste mundo, a principal ameaça são Ciber-Aranhas."
              autoFocus
              rows={3}
              containerStyle={{ width: "100%" }}
            />
            <StyledButton
              onPress={handleSubmitTruth}
              disabled={submittingTruth || !truthInput.trim()}
              props_variant="primary"
              style={styles.actionButton}
            >
              {submittingTruth ? "Enviando..." : "Enviar Verdade"}
            </StyledButton>
          </>
        ) : (
          <Text style={styles.waitingText}>
            Aguardando {getPlayerNameById(currentPlayerIdToDefine || "")}{" "}
            definir a próxima verdade...
          </Text>
        )}
      </>
    );
  };

  const renderCharacterConceptPhase = () => {
    if (!activeGameSetup || !currentUser) return null;
    const myConceptEntry = activeGameSetup.characterConcepts?.find(
      (c) => c.playerId === currentUser.uid
    );

    return (
      <>
        <Text style={styles.headerText}>Fase: Conceitos de Personagem</Text>
        {activeGameSetup.characterConcepts
          ?.filter((c) => c.submitted)
          .map((concept) => (
            <View key={concept.playerId} style={styles.conceptDisplayItem}>
              <Text style={styles.playerNameSmall}>{concept.playerName}: </Text>
              <Text style={styles.conceptText}>
                {concept.concept || "Aguardando..."}
              </Text>
            </View>
          ))}

        {myConceptEntry && !myConceptEntry.submitted && (
          <>
            <StyledTextarea
              label="Descreva seu conceito de personagem"
              value={conceptInput}
              onChangeText={setConceptInput}
              placeholder="Ex: Um detetive cibernético amargurado, um mago exilado buscando redenção..."
              autoFocus
              rows={4}
              containerStyle={{ width: "100%", marginVertical: 10 }}
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
        )}
        {myConceptEntry?.submitted && !activeGameSetup.allConceptsSubmitted && (
          <Text style={styles.waitingText}>
            Aguardando outros jogadores submeterem seus conceitos...
          </Text>
        )}
        {activeGameSetup.allConceptsSubmitted && (
          <Text style={styles.allRolledText}>
            Todos os conceitos foram submetidos!
          </Text>
        )}
      </>
    );
  };

  const renderSkillDiceRollPhase = () => (
    <>
      <Text style={styles.headerText}>
        Fase: Rolagem de Dados (Ordem de Habilidades)
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
            : "Rolar Dados (2d6) para Habilidades"}
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
        "Rolagens Atuais (Habilidades):"
      )}
    </>
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
    const isMyTurn =
      activeGameSetup.currentPlayerIdToDefine === currentUser.uid;
    const playerWhoseTurn = activeGameSetup.skillRolls.find(
      (p) => p.playerId === activeGameSetup.currentPlayerIdToDefine
    );
    const myDefinedSkills = activeGameSetup.definedSkills.filter(
      (s) => s.definedByPlayerId === currentUser.uid && s.type === "player"
    );

    return (
      <>
        <Text style={styles.headerText}>
          Fase: Definição de Habilidades (Jogadores -{" "}
          {
            activeGameSetup.definedSkills.filter((s) => s.type === "player")
              .length
          }
          /{TOTAL_PLAYER_SKILLS})
        </Text>
        <Text style={styles.infoTextSmall}>
          Sua vez de definir {myAllocation?.totalToDefine || 0} habilidade(s).
          Definidas: {myAllocation?.definedCount || 0}.
        </Text>
        <Text style={styles.infoTextSmall}>
          Habilidades não podem ser repetidas.
        </Text>

        {isMyTurn && myAllocation && !myAllocation.finalized && (
          <>
            {myAllocation.definedCount < myAllocation.totalToDefine && (
              <>
                <StyledInput
                  label="Nome da Habilidade"
                  value={skillNameInput}
                  onChangeText={setSkillNameInput}
                  placeholder="Ex: Lutar, Investigar, Enganar"
                  autoFocus
                  containerStyle={{ width: "100%", marginVertical: 10 }}
                />
                <StyledButton
                  onPress={handleAddSkill}
                  disabled={addingSkill || !skillNameInput.trim()}
                  props_variant="primary"
                  style={styles.actionButtonSmall}
                >
                  {addingSkill ? "Adicionando..." : "Adicionar Habilidade"}
                </StyledButton>
              </>
            )}

            {myDefinedSkills.length > 0 && (
              <View style={styles.mySkillsContainer}>
                <Text style={styles.subHeaderTextSmall}>
                  Minhas Habilidades Adicionadas:
                </Text>
                {myDefinedSkills.map((skill) => (
                  <View key={skill.skillName} style={styles.mySkillItem}>
                    <Text style={styles.mySkillText}>{skill.skillName}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveSkill(skill.skillName)}
                      disabled={removingSkillName === skill.skillName}
                      style={styles.removeSkillButton}
                    >
                      <Text style={styles.removeSkillText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {myAllocation.definedCount >= myAllocation.totalToDefine && (
              <StyledButton
                onPress={handleFinalizePlayerSkills}
                disabled={finalizingSkills}
                props_variant="primary"
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.success },
                ]}
              >
                {finalizingSkills
                  ? "Finalizando..."
                  : "Finalizar Minhas Habilidades"}
              </StyledButton>
            )}
          </>
        )}
        {!isMyTurn && playerWhoseTurn && (
          <Text style={styles.waitingText}>
            Aguardando {playerWhoseTurn.playerName} definir habilidades...
          </Text>
        )}
        {myAllocation?.finalized && (
          <Text style={styles.infoTextGreen}>
            Você já finalizou suas habilidades.
          </Text>
        )}

        <View style={styles.allSkillsContainer}>
          <Text style={styles.subHeaderText}>Todas Habilidades Definidas:</Text>
          {activeGameSetup.definedSkills.length === 0 && (
            <Text style={styles.infoText}>
              Nenhuma habilidade definida ainda.
            </Text>
          )}
          {activeGameSetup.definedSkills.map((skill) => (
            <Text key={skill.skillName} style={styles.skillListItem}>
              - {skill.skillName} (por {skill.definedByPlayerName})
            </Text>
          ))}
        </View>
      </>
    );
  };

  const renderAssignSkillModifiersPhase = () => {
    if (
      !activeGameSetup ||
      !currentUser ||
      !activeGameSetup.definedSkills ||
      !activeGameSetup.playerModifierSelectionStatus
    )
      return null;

    const myPlayerStatus =
      activeGameSetup.playerModifierSelectionStatus[currentUser.uid];
    const myPlayerSkillModifiers =
      activeGameSetup.playerSkillModifiers?.[currentUser.uid] || [];
    const allSkills = activeGameSetup.definedSkills;

    if (myPlayerStatus?.finalized) {
      return (
        <>
          <Text style={styles.headerText}>
            Fase: Atribuição de Modificadores de Habilidade
          </Text>
          <Text style={styles.infoTextGreen}>
            Você já finalizou a atribuição de seus modificadores.
          </Text>
          <Text style={styles.waitingText}>
            Aguardando outros jogadores ou o Mestre iniciar...
          </Text>
          <View style={styles.myModifiersSummary}>
            <Text style={styles.subHeaderTextSmall}>
              Seus Modificadores Atribuídos:
            </Text>
            {myPlayerSkillModifiers.map((mod) => (
              <Text key={mod.skillName} style={styles.skillListItem}>
                {mod.skillName}:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {mod.modifierValue > 0 ? "+" : ""}
                  {mod.modifierValue}
                </Text>
              </Text>
            ))}
          </View>
        </>
      );
    }

    return (
      <>
        <Text style={styles.headerText}>
          Fase: Atribuição de Modificadores de Habilidade
        </Text>
        <Text style={styles.infoText}>
          Escolha 4 habilidades da lista abaixo e atribua um dos seguintes
          modificadores a cada uma (um modificador por habilidade, uma
          habilidade por modificador):
        </Text>
        <View style={styles.modifierButtonsContainer}>
          {MODIFIER_VALUES.map((mod) => (
            <TouchableOpacity
              key={mod.value}
              style={[
                styles.modifierButton,
                selectedModifierValue === mod.value &&
                  styles.modifierButtonActive,
                myPlayerStatus?.assignedModifiers?.includes(mod.value) &&
                  styles.modifierButtonUsed,
              ]}
              onPress={() => {
                if (myPlayerStatus?.assignedModifiers?.includes(mod.value)) {
                  showAppAlert(
                    "Atenção",
                    `O modificador ${mod.label} (${mod.value > 0 ? "+" : ""}${mod.value}) já foi usado para outra habilidade. Desmarque a habilidade anterior para usá-lo aqui.`
                  );
                  return;
                }
                setSelectedModifierValue(mod.value);
              }}
              disabled={
                myPlayerStatus?.assignedModifiers?.includes(mod.value) &&
                selectedModifierValue !== mod.value
              }
            >
              <Text
                style={[
                  styles.modifierButtonText,
                  selectedModifierValue === mod.value &&
                    styles.modifierButtonTextActive,
                ]}
              >
                {mod.label} ({mod.value > 0 ? "+" : ""}
                {mod.value})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subHeaderText}>Lista de Todas as Habilidades:</Text>
        <ScrollView style={styles.skillsListScrollView}>
          {allSkills.map((skill) => {
            const assignedModifier = myPlayerSkillModifiers.find(
              (m) => m.skillName === skill.skillName
            );
            return (
              <TouchableOpacity
                key={skill.skillName}
                style={[
                  styles.skillItemForModifier,
                  selectedModifierValue !== null && styles.skillItemHoverable, // Visual cue
                  assignedModifier && styles.skillItemAssigned,
                ]}
                onPress={() => handleAssignSkillModifier(skill.skillName)}
                disabled={assigningModifier}
              >
                <Text style={styles.skillNameText}>{skill.skillName}</Text>
                {assignedModifier && (
                  <Text style={styles.assignedModifierText}>
                    ({assignedModifier.modifierValue > 0 ? "+" : ""}
                    {assignedModifier.modifierValue})
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <StyledButton
          onPress={handleFinalizeSkillModifiers}
          disabled={
            finalizingModifiers ||
            myPlayerStatus?.assignedModifiers?.length !== 4
          }
          props_variant="primary"
          style={[
            styles.actionButton,
            {
              marginTop: 15,
              backgroundColor:
                myPlayerStatus?.assignedModifiers?.length === 4
                  ? colors.success
                  : colors.primary,
            },
          ]}
        >
          {finalizingModifiers ? "Finalizando..." : "Finalizar Modificadores"}
        </StyledButton>
      </>
    );
  };

  // --- MAIN RENDER ---
  if (!activeGameSetup || !currentUser) {
    return (
      <ScreenWrapper title="CONFIGURAR JOGO">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando dados do jogo...</Text>
      </ScreenWrapper>
    );
  }

  const allPlayersHaveRolledInitial =
    activeGameSetup.playerRolls.length ===
    activeGameSetup.numPlayersAtSetupStart;

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
        <>
          <Text style={styles.headerText}>
            Fase: Mestre Definindo Habilidades Finais
          </Text>
          <Text style={styles.waitingText}>
            Aguardando o Mestre adicionar as últimas 4 habilidades...
          </Text>
          <View style={styles.allSkillsContainer}>
            <Text style={styles.subHeaderText}>
              Todas Habilidades Definidas (
              {activeGameSetup.definedSkills?.length || 0}/16):
            </Text>
            {activeGameSetup.definedSkills?.map((skill) => (
              <Text key={skill.skillName} style={styles.skillListItem}>
                - {skill.skillName} (por {skill.definedByPlayerName})
              </Text>
            ))}
          </View>
        </>
      );
      break;
    case GameSetupPhase.ASSIGNING_SKILL_MODIFIERS:
      content = renderAssignSkillModifiersPhase();
      break;
    case GameSetupPhase.AWAITING_GAME_START:
      content = (
        <>
          <Text style={styles.headerText}>Configuração Concluída!</Text>
          <Text style={styles.waitingText}>
            Aguardando o Mestre iniciar a sessão de jogo...
          </Text>
          <View style={styles.allSkillsContainer}>
            <Text style={styles.subHeaderText}>
              Todas Habilidades Definidas (
              {activeGameSetup.definedSkills?.length || 0}/16):
            </Text>
            {activeGameSetup.definedSkills?.map((skill) => (
              <Text key={skill.skillName} style={styles.skillListItem}>
                - {skill.skillName} (por {skill.definedByPlayerName})
              </Text>
            ))}
          </View>
          {activeGameSetup.playerSkillModifiers &&
            activeGameSetup.playerSkillModifiers[currentUser.uid] && (
              <View style={styles.myModifiersSummary}>
                <Text style={styles.subHeaderTextSmall}>
                  Seus Modificadores Atribuídos:
                </Text>
                {activeGameSetup.playerSkillModifiers[currentUser.uid].map(
                  (mod) => (
                    <Text key={mod.skillName} style={styles.skillListItem}>
                      {mod.skillName}:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {mod.modifierValue > 0 ? "+" : ""}
                        {mod.modifierValue}
                      </Text>
                    </Text>
                  )
                )}
              </View>
            )}
        </>
      );
      break;
    default:
      content = <Text style={styles.errorText}>Fase desconhecida.</Text>;
  }

  return (
    <ScreenWrapper title="CONFIGURAR JOGO" childHandlesScrolling={true}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {activeGameSetup.interferenceTokens &&
          activeGameSetup.interferenceTokens[currentUser.uid] > 0 && (
            <View style={styles.tokenInfoBox}>
              <Text style={styles.tokenText}>
                Você tem {activeGameSetup.interferenceTokens[currentUser.uid]}{" "}
                token(s) de interferência!
              </Text>
            </View>
          )}
        {content}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
    color: colors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
    textAlign: "left",
    width: "100%",
  },
  subHeaderTextSmall: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 5,
  },
  actionButton: {
    marginTop: 10,
    marginBottom: 20,
    width: "100%",
  },
  actionButtonSmall: {
    marginTop: 8,
    marginBottom: 12,
    width: "100%",
  },
  myRollText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.success,
    marginVertical: 10,
  },
  waitingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: 15,
    fontStyle: "italic",
  },
  allRolledText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.success,
    textAlign: "center",
    marginVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: 5,
  },
  infoTextSmall: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginVertical: 3,
    marginBottom: 8,
  },
  infoTextGreen: {
    fontSize: 15,
    color: colors.success,
    fontWeight: "500",
    textAlign: "center",
    marginVertical: 10,
  },
  rollsHeader: {
    // Added missing style
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 15,
    marginBottom: 8,
    textAlign: "center",
    width: "100%",
  },
  rollsContainer: {
    width: "100%",
    marginTop: 5,
  },
  playerRollItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.stone100,
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  playerName: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  playerNameSmall: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  rollValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },
  worldDefDisplay: {
    backgroundColor: colors.stone100,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    width: "100%",
  },
  worldDefText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  worldDefValue: {
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  tokenInfoBox: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 15,
    alignSelf: "stretch",
    alignItems: "center",
  },
  tokenText: {
    color: colors.primaryContrast,
    fontSize: 14,
    fontWeight: "500",
  },
  truthsDisplay: {
    width: "100%",
    backgroundColor: colors.stone100,
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  truthItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  conceptDisplayItem: {
    backgroundColor: colors.stone100,
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
    width: "100%",
  },
  conceptText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  allSkillsContainer: {
    width: "100%",
    marginTop: 15,
    padding: 10,
    backgroundColor: colors.stone100,
    borderRadius: 6,
  },
  skillListItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  mySkillsContainer: {
    width: "100%",
    marginVertical: 10,
    padding: 10,
    backgroundColor: colors.stone200,
    borderRadius: 6,
  },
  mySkillItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  mySkillText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  removeSkillButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeSkillText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: "bold",
  },
  modifierButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 15,
    width: "100%",
  },
  modifierButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    margin: 4,
    minWidth: "45%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  modifierButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.stone300,
  },
  modifierButtonUsed: {
    backgroundColor: colors.stone200,
    opacity: 0.6,
  },
  modifierButtonText: {
    color: colors.secondaryContrast,
    fontWeight: "500",
    fontSize: 13,
  },
  modifierButtonTextActive: {
    color: colors.primary,
  },
  skillsListScrollView: {
    maxHeight: 200,
    width: "100%",
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: 6,
    padding: 5,
    marginBottom: 10,
  },
  skillItemForModifier: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone200,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skillItemHoverable: {
    backgroundColor: colors.stone100,
  },
  skillItemAssigned: {
    backgroundColor: colors.success + "33", // Light green tint
  },
  skillNameText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  assignedModifierText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  myModifiersSummary: {
    width: "100%",
    marginTop: 15,
    padding: 10,
    backgroundColor: colors.stone100,
    borderRadius: 6,
  },
});

export default GameSetupScreen;
