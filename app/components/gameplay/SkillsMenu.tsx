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
  playerAssignedSkills: PlayerSkillModifierChoice[]; // Player's 4 chosen skills with modifiers
  allDefinedSkills: DefinedSkill[]; // All 16 skills (player + GM)
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

  const getSkillModifier = (skillName: string): number => {
    const foundAssignedSkill = playerAssignedSkills.find(
      (s) => s.skillName === skillName
    );
    return foundAssignedSkill ? foundAssignedSkill.modifierValue : 0;
  };

  const handleSkillRoll = async (skillName: string) => {
    setRollingSkillName(skillName);
    const modifier = getSkillModifier(skillName);
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
          <Text style={styles.menuTitle}>Habilidades Disponíveis</Text>
          <ScrollView contentContainerStyle={styles.skillsList}>
            {allDefinedSkills.length === 0 && (
              <Text style={styles.emptyText}>
                Nenhuma habilidade definida no jogo.
              </Text>
            )}
            {allDefinedSkills.map((definedSkill) => {
              const modifier = getSkillModifier(definedSkill.skillName);
              return (
                <View key={definedSkill.skillName} style={styles.skillItem}>
                  <Text style={styles.skillName}>{definedSkill.skillName}</Text>
                  <Text style={styles.skillModifier}>
                    ({modifier >= 0 ? "+" : ""}
                    {modifier})
                  </Text>
                  <TouchableOpacity
                    style={[styles.rollButton, commonStyles.dashedBorder]}
                    onPress={() => handleSkillRoll(definedSkill.skillName)}
                    disabled={rollingSkillName === definedSkill.skillName}
                  >
                    {rollingSkillName === definedSkill.skillName ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.rollButtonText}>Rolar 2d6</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone200,
  },
  skillName: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 2,
  },
  skillModifier: {
    fontSize: 15,
    color: colors.textSecondary,
    marginHorizontal: 8,
    fontWeight: "500",
  },
  rollButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderColor: colors.primary,
    minWidth: 80,
    alignItems: "center",
  },
  rollButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default SkillsMenu;
