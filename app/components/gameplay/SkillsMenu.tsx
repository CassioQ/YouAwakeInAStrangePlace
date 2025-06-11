import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import {
  PlayerSkillModifierChoice,
  DefinedSkill,
} from "../../models/GameServer.types";
import { rollSkillDiceForGameplay } from "../../services/firebaseServices";
import { showAppAlert } from "../../utils/alertUtils";

interface SkillsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  playerAssignedSkills: PlayerSkillModifierChoice[];
  allDefinedSkills: DefinedSkill[];
  serverId: string;
  playerId: string;
  playerName: string;
}

const SkillsMenu: React.FC<SkillsMenuProps> = ({
  isVisible,
  onClose,
  playerAssignedSkills,
  allDefinedSkills,
  serverId,
  playerId,
  playerName,
}) => {
  const [rollingSkillName, setRollingSkillName] = useState<string | null>(null);

  const handleSkillRoll = async (skillName: string, modifier: number) => {
    setRollingSkillName(skillName);
    try {
      await rollSkillDiceForGameplay(
        serverId,
        playerId,
        playerName,
        skillName,
        modifier
      );
    } catch (error: any) {
      showAppAlert(
        "Erro ao Rolar",
        error.message || "Não foi possível registrar a rolagem."
      );
    } finally {
      setRollingSkillName(null);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View
          style={[styles.menuContainer, commonStyles.shadow]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handleBarContainer} onTouchEnd={onClose}>
            <View style={styles.handleBar} />
          </View>
          <Text style={styles.menuTitle}>Minhas Habilidades</Text>
          <ScrollView contentContainerStyle={styles.skillsList}>
            {allDefinedSkills.length === 0 && (
              <Text style={styles.emptyText}>
                Nenhuma habilidade disponível.
              </Text>
            )}
            {allDefinedSkills.map((definedSkill) => {
              const assignedSkill = playerAssignedSkills.find(
                (s) => s.skillName === definedSkill.skillName
              );
              const modifier = assignedSkill ? assignedSkill.modifierValue : 0;
              const isPlayerMainSkill = !!assignedSkill;

              return (
                <View
                  key={definedSkill.skillName}
                  style={[
                    styles.skillItem,
                    isPlayerMainSkill && styles.playerMainSkillItem,
                  ]}
                >
                  <View style={styles.skillInfo}>
                    <Text
                      style={[
                        styles.skillName,
                        isPlayerMainSkill && styles.playerMainSkillName,
                      ]}
                    >
                      {definedSkill.skillName}
                    </Text>
                    <Text
                      style={[
                        styles.skillModifier,
                        isPlayerMainSkill && styles.playerMainSkillModifier,
                      ]}
                    >
                      ({modifier >= 0 ? "+" : ""}
                      {modifier})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.rollButton, commonStyles.dashedBorder]}
                    onPress={() =>
                      handleSkillRoll(definedSkill.skillName, modifier)
                    }
                    disabled={rollingSkillName === definedSkill.skillName}
                  >
                    {rollingSkillName === definedSkill.skillName ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          isPlayerMainSkill
                            ? colors.primaryContrast
                            : colors.primary
                        }
                      />
                    ) : (
                      <Text
                        style={[
                          styles.rollButtonText,
                          isPlayerMainSkill && styles.playerMainRollButtonText,
                        ]}
                      >
                        Rolar 2d6
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  menuContainer: {
    backgroundColor: colors.backgroundPaper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "70%",
  },
  handleBarContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: colors.divider,
    borderRadius: 2.5,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 15,
  },
  skillsList: {},
  skillItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10, // Adjusted padding
    borderBottomWidth: 1,
    borderBottomColor: colors.stone200,
  },
  playerMainSkillItem: {
    backgroundColor: colors.primary + "1A", // Light primary tint for main skills
    paddingHorizontal: 8, // Add some horizontal padding for tint
    marginHorizontal: -8, // Counteract padding to maintain alignment
    borderRadius: 4,
  },
  skillInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8, // Space before roll button
  },
  skillName: {
    fontSize: 16,
    color: colors.textPrimary,
    flexShrink: 1, // Allow skill name to shrink if needed
  },
  playerMainSkillName: {
    fontWeight: "600",
    color: colors.primary,
  },
  skillModifier: {
    fontSize: 15,
    color: colors.textSecondary,
    marginLeft: 8, // Space between name and modifier
    fontWeight: "500",
  },
  playerMainSkillModifier: {
    color: colors.primary,
  },
  rollButton: {
    paddingVertical: 8, // Increased padding
    paddingHorizontal: 12,
    borderRadius: 4,
    borderColor: colors.primary,
    minWidth: 90, // Adjusted minWidth
    alignItems: "center",
    justifyContent: "center", // Center content
  },
  rollButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  playerMainRollButtonText: {
    // color: colors.primaryContrast, // If button background changes
  },
  emptyText: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default SkillsMenu;
