import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import SkillsMenu from "./SkillsMenu";
import InterferenceTokenModal from "./InterferenceTokenModal";
import {
  PlayerSkillModifierChoice,
  DefinedSkill,
  PlayerGameplayState,
} from "../../models/GameServer.types";
import { AppContext } from "../../contexts/AppContexts";
import { rollGenericDiceForGameplay } from "../../services/firebaseServices";
import { showAppAlert } from "../../utils/alertUtils";
import PlayerHpEditModal from "./PlayerHpEditModal";

interface PlayerFooterProps {
  characterName: string;
  currentHp: number;
  maxHp: number;
  playerAssignedSkills: PlayerSkillModifierChoice[];
  allDefinedSkills: DefinedSkill[];
  avatarUrl?: string;
  serverId: string;
  playerId: string;
  playerName: string;
  interferenceTokens: number; // This prop might be redundant if using context
  allPlayerStates: PlayerGameplayState[];
}

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";
const defaultPlayerAvatar =
  "https://ui-avatars.com/api/?name=J&background=random&size=30";

const PlayerFooter: React.FC<PlayerFooterProps> = ({
  characterName,
  currentHp,
  maxHp,
  playerAssignedSkills,
  allDefinedSkills,
  avatarUrl,
  serverId,
  playerId,
  playerName,
  // interferenceTokens, // This can be fetched from context now
  allPlayerStates,
}) => {
  const context = useContext(AppContext);
  const [isSkillsMenuVisible, setIsSkillsMenuVisible] = useState(false);
  const [isPlayerListVisible, setIsPlayerListVisible] = useState(false);
  const [isTokenModalVisible, setIsTokenModalVisible] = useState(false);
  const [isHpEditModalVisible, setIsHpEditModalVisible] = useState(false); // State for HP edit modal
  const [rollingGenericDice, setRollingGenericDice] = useState(false);

  const myPlayerState = context?.gameplayState?.playerStates[playerId];
  const currentInterferenceTokens = myPlayerState?.interferenceTokens ?? 0;
  const actualCurrentHp = myPlayerState?.currentHp ?? currentHp;
  const actualMaxHp = myPlayerState?.maxHp ?? maxHp;

  const handleGenericRoll = async () => {
    setRollingGenericDice(true);
    try {
      await rollGenericDiceForGameplay(serverId, playerId, playerName);
    } catch (error: any) {
      showAppAlert(
        "Erro ao Rolar 2d6",
        error.message || "Não foi possível registrar a rolagem."
      );
    } finally {
      setRollingGenericDice(false);
    }
  };

  const normalHpPercentage =
    actualMaxHp > 0 ? Math.min(100, (actualCurrentHp / actualMaxHp) * 100) : 0;
  const bonusHpPercentage =
    actualCurrentHp > actualMaxHp
      ? ((actualCurrentHp - actualMaxHp) / actualMaxHp) * 100
      : 0;

  return (
    <>
      <View style={[styles.footerContainer, commonStyles.shadow]}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={() => setIsPlayerListVisible(true)}
            style={styles.iconButton}
            accessibilityLabel="Ver lista de jogadores"
          >
            <Text style={styles.footerIconText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsTokenModalVisible(true)}
            style={styles.iconButton}
            accessibilityLabel="Usar token de interferência"
          >
            <Text style={styles.footerIconText}>✧</Text>
            {currentInterferenceTokens > 0 && (
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>
                  {currentInterferenceTokens}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGenericRoll}
            style={styles.iconButton}
            disabled={rollingGenericDice}
            accessibilityLabel="Rolar 2d6 (dois dados de seis lados)"
          >
            {rollingGenericDice ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.genericRollText}>2d6</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.centerSection}
          onPress={() => setIsHpEditModalVisible(true)}
          accessibilityLabel="Editar Pontos de Vida"
        >
          <Image
            source={{
              uri:
                avatarUrl ||
                defaultAvatar.replace(
                  "name=P",
                  `name=${encodeURIComponent(characterName[0]) || "P"}`
                ),
            }}
            style={styles.avatar}
          />
          <View style={styles.infoContainer}>
            <Text style={styles.characterName} numberOfLines={1}>
              {characterName}
            </Text>
            <View style={styles.hpBarOuter}>
              <View style={styles.hpBarBackground} />
              <View
                style={[
                  styles.hpBarFillNormal,
                  { width: `${normalHpPercentage}%` },
                ]}
              />
              {actualCurrentHp > actualMaxHp && (
                <View
                  style={[
                    styles.hpBarFillBonus,
                    { width: `${bonusHpPercentage}%` },
                  ]}
                />
              )}
              <Text
                style={styles.hpTextValue}
              >{`${actualCurrentHp} / ${actualMaxHp} HP`}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.skillsButtonMain}
            onPress={() => setIsSkillsMenuVisible(true)}
            accessibilityLabel="Abrir menu de habilidades"
          >
            <Text style={styles.skillsButtonText}>SKILLS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SkillsMenu
        isVisible={isSkillsMenuVisible}
        onClose={() => setIsSkillsMenuVisible(false)}
        playerAssignedSkills={playerAssignedSkills}
        allDefinedSkills={allDefinedSkills}
        serverId={serverId}
        playerId={playerId}
        playerName={playerName}
      />

      <InterferenceTokenModal
        isVisible={isTokenModalVisible}
        onClose={() => setIsTokenModalVisible(false)}
        serverId={serverId}
        playerId={playerId}
        playerName={playerName}
        currentTokenCount={currentInterferenceTokens}
      />

      <PlayerHpEditModal
        isVisible={isHpEditModalVisible}
        onClose={() => setIsHpEditModalVisible(false)}
        characterName={characterName}
        currentHp={actualCurrentHp}
        maxHp={actualMaxHp}
        avatarUrl={avatarUrl}
        serverId={serverId}
        playerId={playerId}
        playerName={playerName}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={isPlayerListVisible}
        onRequestClose={() => setIsPlayerListVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsPlayerListVisible(false)}
        >
          <View style={[styles.playerListModalContainer, commonStyles.shadow]}>
            <Text style={styles.playerListTitle}>
              Jogadores na Sessão ({allPlayerStates.length})
            </Text>
            <FlatList
              data={allPlayerStates}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <View style={styles.playerItem}>
                  <Image
                    source={{
                      uri:
                        item.avatarUrl ||
                        defaultPlayerAvatar.replace(
                          "name=J",
                          `name=${encodeURIComponent(item.characterName[0]) || "J"}`
                        ),
                    }}
                    style={styles.playerAvatar}
                  />
                  <View>
                    <Text style={styles.modalPlayerName}>
                      {item.characterName}
                    </Text>
                    <Text style={styles.modalPlayerHp}>
                      HP: {item.currentHp}/{item.maxHp}
                    </Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsPlayerListVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundPaper,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    minHeight: 65,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  centerSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  rightSection: {
    // alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 30,
  },
  footerIconText: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  genericRollText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "bold",
  },
  tokenBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: colors.error,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  tokenBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.stone200,
    marginRight: 8,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  characterName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  hpBarOuter: {
    // Renamed from hpBarContainer for clarity within PlayerFooter
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.hpBackground,
    width: "100%", // Ensure it takes the width of its parent (infoContainer)
    position: "relative",
    overflow: "hidden",
  },
  hpBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.hpBackground,
    borderRadius: 8,
  },
  hpBarFillNormal: {
    height: "100%",
    backgroundColor: colors.hpDefaultFill,
    borderRadius: 8,
    position: "absolute",
    left: 0,
    top: 0,
  },
  hpBarFillBonus: {
    height: "100%",
    backgroundColor: colors.bonusHp,
    borderRadius: 8,
    position: "absolute",
    left: 0,
    top: 0,
  },
  hpTextValue: {
    // Renamed from hpText for clarity
    position: "absolute",
    alignSelf: "center",
    lineHeight: 16, // Match bar height
    fontSize: 9,
    fontWeight: "600",
    color: colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  skillsButtonMain: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...commonStyles.shadow,
  },
  skillsButtonText: {
    color: colors.primaryContrast,
    fontSize: 13,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  playerListModalContainer: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 10,
    padding: 15,
    width: "85%",
    maxHeight: "70%",
  },
  playerListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  playerAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    backgroundColor: colors.stone200,
  },
  modalPlayerName: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  modalPlayerHp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: colors.secondary,
    borderRadius: 6,
    alignItems: "center",
  },
  closeButtonText: {
    color: colors.secondaryContrast,
    fontWeight: "500",
  },
});

export default PlayerFooter;
