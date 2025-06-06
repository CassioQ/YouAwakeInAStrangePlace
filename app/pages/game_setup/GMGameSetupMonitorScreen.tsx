
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { GameSetupPhase, ScreenEnum, GamePhase } from "../../models/enums/CommomEnuns";
import { PlayerRoll, WorldTruth, PlayerConceptEntry, DefinedSkill, PlayerSkillAllocation, PlayerSkillModifierChoice, PlayerModifierSelectionStatus, GameServer } from "../../models/GameServer.types";
import { listenToGameSetup, addGmSkill, finalizeGmSkills, initiateGameplaySession, listenToServerStatusAndPhase } from "../../services/firebaseServices";
import { Unsubscribe } from "firebase/firestore";
import StyledButton from "../../components/StyledButton";
import StyledInput from "../../components/StyledInput";
import { showAppAlert } from '../../utils/alertUtils';

const defaultAvatar = "https://ui-avatars.com/api/?name=P&background=random&size=40";


const GMGameSetupMonitorScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [gmSkillInput, setGmSkillInput] = useState("");
  const [submittingGmSkill, setSubmittingGmSkill] = useState(false);
  const [finalizingGmSkillsState, setFinalizingGmSkillsState] = useState(false);
  const [initiatingGameplay, setInitiatingGameplay] = useState(false);


  if (!context) return null;
  const {
    activeServerDetails,
    setActiveServerDetails,
    activeGameSetup,
    setActiveGameSetup,
    navigateTo,
    currentUser,
    setGameplayState, 
  } = context;

  useEffect(() => {
    let unsubscribeListener: Unsubscribe | undefined;
    if (activeServerDetails?.id) {
      unsubscribeListener = listenToServerStatusAndPhase(
        activeServerDetails.id,
        (status, gamePhase, gameSetupData, gameplayData) => {
          // Correctly update activeServerDetails by passing a new object
          if (activeServerDetails) {
            const updatedDetails: GameServer = {
              ...activeServerDetails,
              status,
              gamePhase: gamePhase || activeServerDetails.gamePhase, // Keep existing if undefined
              gameSetup: gameSetupData || activeServerDetails.gameSetup,
              gameplay: gameplayData || activeServerDetails.gameplay,
            };
            setActiveServerDetails(updatedDetails);
          }
          setActiveGameSetup(gameSetupData || null);
          setGameplayState(gameplayData || null);

          if (gamePhase === GamePhase.ACTIVE) {
            navigateTo(ScreenEnum.GM_GAMEPLAY); 
          }
        }
      );
    }
    return () => {
      if (unsubscribeListener) unsubscribeListener();
    };
  }, [activeServerDetails, setActiveGameSetup, setActiveServerDetails, setGameplayState, navigateTo]); // Added activeServerDetails to dependency array for correct update


  const getPlayerNameById = (playerId: string): string => {
    if (playerId === activeServerDetails?.gmId) return "Mestre";
    const player = activeServerDetails?.players.find(p => p.userId === playerId);
    return player?.playerName || "Jogador Desconhecido";
  }

  const handleAddGmSkill = async () => {
    if (!activeServerDetails?.id || !currentUser || !gmSkillInput.trim()) return;
    setSubmittingGmSkill(true);
    try {
      await addGmSkill(activeServerDetails.id, currentUser.uid, currentUser.displayName || "Mestre", gmSkillInput);
      setGmSkillInput("");
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setSubmittingGmSkill(false);
    }
  };

  const handleFinalizeGmSkills = async () => {
     if (!activeServerDetails?.id || !currentUser) return;
    setFinalizingGmSkillsState(true);
    try {
      await finalizeGmSkills(activeServerDetails.id, currentUser.uid);
    } catch (error: any) {
      showAppAlert("Erro", error.message);
    } finally {
      setFinalizingGmSkillsState(false);
    }
  };

  const handleInitiateGameplay = async () => {
    if (!activeServerDetails?.id || !currentUser) return;
    setInitiatingGameplay(true);
    try {
      await initiateGameplaySession(activeServerDetails.id, currentUser.uid);
      // Navigation will be handled by the listener to gamePhase
    } catch (error: any) {
      showAppAlert("Erro ao Iniciar Jogo", error.message);
    } finally {
      setInitiatingGameplay(false);
    }
  }


  if (!activeServerDetails) {
    return (
      <ScreenWrapper title="MONITORAR CONFIGURAÇÃO">
        <View style={styles.centeredMessage}><Text style={styles.errorText}>Nenhum servidor ativo.</Text></View>
      </ScreenWrapper>
    );
  }

  if (!activeGameSetup) {
    return (
      <ScreenWrapper title="MONITORAR CONFIGURAÇÃO">
        <View style={styles.centeredMessage}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Carregando...</Text></View>
      </ScreenWrapper>
    );
  }

  let currentPhaseDisplay = "Aguardando...";
  switch (activeGameSetup.currentPhase) {
    case GameSetupPhase.ROLLING: currentPhaseDisplay = "Rolagem de Dados (Mundo)"; break;
    case GameSetupPhase.DEFINING_GENRE: currentPhaseDisplay = "Definindo Gênero"; break;
    case GameSetupPhase.DEFINING_ADJECTIVE: currentPhaseDisplay = "Definindo Adjetivo"; break;
    case GameSetupPhase.DEFINING_LOCATION: currentPhaseDisplay = "Definindo Local"; break;
    case GameSetupPhase.DEFINING_TRUTHS: currentPhaseDisplay = "Definindo Verdades do Mundo"; break;
    case GameSetupPhase.DEFINING_CHARACTER_CONCEPTS: currentPhaseDisplay = "Definindo Conceitos de Personagem"; break;
    case GameSetupPhase.SKILL_DICE_ROLL: currentPhaseDisplay = "Rolagem de Dados (Habilidades)"; break;
    case GameSetupPhase.DEFINING_PLAYER_SKILLS: currentPhaseDisplay = "Jogadores Definindo Habilidades"; break;
    case GameSetupPhase.DEFINING_GM_SKILLS: currentPhaseDisplay = "Mestre Definindo Habilidades"; break;
    case GameSetupPhase.ASSIGNING_SKILL_MODIFIERS: currentPhaseDisplay = "Jogadores Atribuindo Modificadores"; break;
    case GameSetupPhase.AWAITING_GAME_START: currentPhaseDisplay = "Aguardando Início do Jogo"; break;
  }

  const currentPlayerDefiningName = activeGameSetup.currentPlayerIdToDefine
    ? getPlayerNameById(activeGameSetup.currentPlayerIdToDefine)
    : (activeGameSetup.currentPhase === GameSetupPhase.DEFINING_CHARACTER_CONCEPTS || activeGameSetup.currentPhase === GameSetupPhase.ASSIGNING_SKILL_MODIFIERS || activeGameSetup.currentPhase === GameSetupPhase.AWAITING_GAME_START ) ? "Todos os Jogadores" : "Ninguém";

  const renderPlayerAllocations = () => {
    if (!activeGameSetup?.skillsPerPlayerAllocation || !activeGameSetup?.skillRolls) return null;
    return activeGameSetup.skillRolls.map(roll => {
        const allocation = activeGameSetup.skillsPerPlayerAllocation![roll.playerId];
        if (!allocation) return null;
        return (
            <Text key={roll.playerId} style={styles.infoTextItem}>
                {roll.playerName}: {allocation.definedCount}/{allocation.totalToDefine} habilidades {allocation.finalized ? "(Finalizado)" : "(Definindo)"}
            </Text>
        );
    });
  };

  const renderPlayerModifierStatus = () => {
    if (!activeGameSetup.playerModifierSelectionStatus || !activeServerDetails.players) return null;
    return activeServerDetails.players.map(player => {
      const status = activeGameSetup.playerModifierSelectionStatus![player.userId];
      const modifiers = activeGameSetup.playerSkillModifiers?.[player.userId] || [];
      return (
        <View key={player.userId} style={styles.playerModifierStatusBox}>
          <Text style={styles.playerNameSmall}>{player.playerName}: {status?.finalized ? <Text style={{color: colors.success}}>Finalizado</Text> : "Selecionando..."} ({status?.assignedModifiers?.length || 0}/4)</Text>
          {modifiers.length > 0 && (
            <View style={styles.playerModifiersList}>
              {modifiers.map(mod => (
                <Text key={mod.skillName} style={styles.modifierDetailText}>
                  {mod.skillName}: <Text style={{fontWeight: 'bold'}}>{mod.modifierValue > 0 ? '+' : ''}{mod.modifierValue}</Text>
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    });
  };

  const allPlayersFinalizedModifiers = activeGameSetup.playerModifierSelectionStatus &&
    activeServerDetails.players.every(p => activeGameSetup.playerModifierSelectionStatus![p.userId]?.finalized);


  return (
    <ScreenWrapper title={`MONITOR: ${activeServerDetails.serverName}`} childHandlesScrolling={true}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Text style={styles.headerText}>Fase Atual: <Text style={styles.phaseText}>{currentPhaseDisplay}</Text></Text>
        <Text style={styles.currentDefinerText}>Vez de: <Text style={{fontWeight: 'bold'}}>{currentPlayerDefiningName}</Text></Text>

        <View style={[styles.summaryBox, commonStyles.dashedBorder]}>
          <Text style={styles.summaryTitle}>Definição do Mundo:</Text>
          <Text style={styles.summaryItem}>Gênero: <Text style={styles.summaryValue}>{activeGameSetup.worldDefinition?.genre?.value || "..."}</Text></Text>
          <Text style={styles.summaryItem}>Adjetivo: <Text style={styles.summaryValue}>{activeGameSetup.worldDefinition?.adjective?.value || "..."}</Text></Text>
          <Text style={styles.summaryItem}>Local: <Text style={styles.summaryValue}>{activeGameSetup.worldDefinition?.location?.value || "..."}</Text></Text>
        </View>

        {activeGameSetup.worldTruths && activeGameSetup.worldTruths.length > 0 && (
          <View style={[styles.summaryBox, commonStyles.dashedBorder]}>
            <Text style={styles.summaryTitle}>Verdades do Mundo:</Text>
            {activeGameSetup.worldTruths.map((truth: WorldTruth, idx: number) => (
              <Text key={idx} style={styles.summaryItem}>{truth.order}. <Text style={styles.summaryValue}>{truth.truth}</Text> (por {truth.definedByPlayerName})</Text>
            ))}
          </View>
        )}

        {activeGameSetup.characterConcepts && (activeGameSetup.currentPhase === GameSetupPhase.DEFINING_CHARACTER_CONCEPTS || activeGameSetup.allConceptsSubmitted) && (
          <View style={[styles.summaryBox, commonStyles.dashedBorder]}>
            <Text style={styles.summaryTitle}>Conceitos de Personagem ({activeGameSetup.characterConcepts.filter(c=>c.submitted).length}/{activeGameSetup.numPlayersAtSetupStart}):</Text>
            {activeGameSetup.characterConcepts.filter(c=>c.submitted).map((concept: PlayerConceptEntry) => (
              <Text key={concept.playerId} style={styles.summaryItem}>{concept.playerName}: <Text style={styles.summaryValue}>{concept.concept || "..."}</Text></Text>
            ))}
             {activeGameSetup.characterConcepts.filter(c=>!c.submitted).length > 0 && <Text style={styles.infoText}>Aguardando conceitos...</Text>}
          </View>
        )}

        {(activeGameSetup.currentPhase === GameSetupPhase.SKILL_DICE_ROLL || activeGameSetup.allSkillRollsSubmitted) && activeGameSetup.skillRolls && (
             <View style={[styles.summaryBox, commonStyles.dashedBorder]}>
                <Text style={styles.summaryTitle}>Rolagens para Habilidades ({activeGameSetup.skillRolls.length}/{activeGameSetup.numPlayersAtSetupStart}):</Text>
                {activeGameSetup.skillRolls.map((roll: PlayerRoll) => (
                     <Text key={roll.playerId} style={styles.summaryItem}>{roll.playerName}: <Text style={styles.summaryValue}>{roll.rollValue}</Text></Text>
                ))}
                {!activeGameSetup.allSkillRollsSubmitted && <Text style={styles.infoText}>Aguardando rolagens...</Text>}
            </View>
        )}

        {activeGameSetup.currentPhase === GameSetupPhase.DEFINING_PLAYER_SKILLS && activeGameSetup.skillsPerPlayerAllocation && (
            <View style={[styles.summaryBox, commonStyles.dashedBorder]}>
                <Text style={styles.summaryTitle}>Definição de Habilidades pelos Jogadores:</Text>
                {renderPlayerAllocations()}
            </View>
        )}

        {activeGameSetup.definedSkills && activeGameSetup.definedSkills.length > 0 && (
           <View style={[styles.summaryBox, commonStyles.dashedBorder]}>
                <Text style={styles.summaryTitle}>Habilidades Definidas ({activeGameSetup.definedSkills.length}/16):</Text>
                {activeGameSetup.definedSkills.map((skill: DefinedSkill, idx: number) => (
                     <Text key={idx} style={styles.summaryItem}>
                         {skill.skillName} (por {skill.definedByPlayerName} - {skill.type === 'player' ? 'Jogador' : 'Mestre'})
                     </Text>
                ))}
            </View>
        )}


        {activeGameSetup.currentPhase === GameSetupPhase.DEFINING_GM_SKILLS && currentUser?.uid === activeServerDetails.gmId && (
          <View style={[styles.gmActionBox, commonStyles.shadow]}>
            <Text style={styles.actionTitle}>Adicionar Habilidades do Mestre ({activeGameSetup.gmSkillsDefinedCount || 0}/4)</Text>
            {(activeGameSetup.gmSkillsDefinedCount || 0) < 4 ? (
              <>
                <StyledInput
                  label="Nome da Habilidade"
                  value={gmSkillInput}
                  onChangeText={setGmSkillInput}
                  placeholder="Habilidade única"
                  containerStyle={{width: '100%', marginBottom: 10}}
                />
                <StyledButton onPress={handleAddGmSkill} disabled={submittingGmSkill || !gmSkillInput.trim()} props_variant="primary">
                  {submittingGmSkill ? "Adicionando..." : "Adicionar Habilidade do Mestre"}
                </StyledButton>
              </>
            ) : (
               <Text style={styles.infoTextGreen}>Você definiu todas as 4 habilidades do Mestre.</Text>
            )}
             <StyledButton
                onPress={handleFinalizeGmSkills}
                disabled={finalizingGmSkillsState || (activeGameSetup.gmSkillsDefinedCount || 0) < 4}
                props_variant="primary"
                style={{marginTop: 10, backgroundColor: colors.success}}
              >
              {finalizingGmSkillsState ? "Finalizando..." : "Finalizar Habilidades"}
            </StyledButton>
          </View>
        )}

         {activeGameSetup.currentPhase === GameSetupPhase.ASSIGNING_SKILL_MODIFIERS && (
           <View style={[styles.summaryBox, commonStyles.dashedBorder]}>
             <Text style={styles.summaryTitle}>Atribuição de Modificadores:</Text>
             {renderPlayerModifierStatus()}
           </View>
         )}


        {activeGameSetup.currentPhase === GameSetupPhase.AWAITING_GAME_START && (
           <StyledButton
            onPress={handleInitiateGameplay}
            props_variant="primary"
            style={{marginTop: 20, backgroundColor: colors.success, paddingVertical: 15}}
            disabled={!allPlayersFinalizedModifiers || initiatingGameplay}
          >
            {initiatingGameplay ? "Iniciando Sessão..." : "INICIAR SESSÃO DE JOGO"}
          </StyledButton>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 30 },
  centeredMessage: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
  errorText: { fontSize: 16, color: colors.error, textAlign: "center" },
  headerText: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary, marginBottom: 5, textAlign: "center"},
  phaseText: { color: colors.primary },
  currentDefinerText: { fontSize: 16, color: colors.textSecondary, textAlign: "center", marginBottom: 15, fontStyle: 'italic' },

  summaryBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: colors.stone100,
    borderRadius: 8,
    borderColor: colors.divider, 
  },
  summaryTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 8, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: 5},
  summaryItem: { fontSize: 14, color: colors.textSecondary, marginBottom: 3 },
  summaryValue: { fontWeight: '500', color: colors.textPrimary },

  infoText: { fontSize: 14, color: colors.textSecondary, fontStyle: "italic", textAlign: "center", marginTop: 8 },
  infoTextGreen: { fontSize: 15, color: colors.success, fontWeight: '500', textAlign: 'center', marginVertical: 8 },
  infoTextItem: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },

  gmActionBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    ...commonStyles.shadow,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  playerModifierStatusBox: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  playerNameSmall: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  playerModifiersList: {
    paddingLeft: 10,
    marginTop: 4,
  },
  modifierDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
  }
});

export default GMGameSetupMonitorScreen;