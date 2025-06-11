import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import GMSkillsMenu from "./GMSkillsMenu";
import PlayerListModal from "./PlayerListModal";
import {
  DefinedSkill,
  PlayerGameplayState,
} from "../../models/GameServer.types";
import { rollGenericDiceForGameplay } from "../../services/firebaseServices";
import { showAppAlert } from "../../utils/alertUtils";

interface GMFooterProps {
  allDefinedSkills: DefinedSkill[];
  serverId: string;
  gmId: string;
  gmName: string;
  allPlayerStates: PlayerGameplayState[];
}

const GMFooter: React.FC<GMFooterProps> = ({
  allDefinedSkills,
  serverId,
  gmId,
  gmName,
  allPlayerStates,
}) => {
  const [isSkillsMenuVisible, setIsSkillsMenuVisible] = useState(false);
  const [isPlayerListVisible, setIsPlayerListVisible] = useState(false);
  const [rollingGenericDice, setRollingGenericDice] = useState(false);

  const handleGenericRoll = async () => {
    setRollingGenericDice(true);
    try {
      await rollGenericDiceForGameplay(serverId, gmId, gmName);
    } catch (error: any) {
      showAppAlert(
        "Erro ao Rolar 2d6",
        error.message || "Não foi possível registrar a rolagem."
      );
    } finally {
      setRollingGenericDice(false);
    }
  };

  return (
    <>
      <View style={[styles.footerContainer, commonStyles.shadow]}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={() => setIsPlayerListVisible(true)}
            style={styles.iconButton}
            accessibilityLabel="Ver lista de jogadores e seus status"
          >
            <Text style={styles.footerIconText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGenericRoll}
            style={styles.iconButton}
            disabled={rollingGenericDice}
            accessibilityLabel="Rolar 2d6 (dois dados de seis lados) como Mestre"
          >
            {rollingGenericDice ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.genericRollText}>2d6</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.gmLabel}>MESTRE</Text>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.skillsButtonMain}
            onPress={() => setIsSkillsMenuVisible(true)}
            accessibilityLabel="Abrir menu de habilidades do Mestre"
          >
            <Text style={styles.skillsButtonText}>SKILLS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <GMSkillsMenu
        isVisible={isSkillsMenuVisible}
        onClose={() => setIsSkillsMenuVisible(false)}
        availableSkills={allDefinedSkills}
        serverId={serverId}
        gmId={gmId}
        gmName={gmName}
      />

      <PlayerListModal
        isVisible={isPlayerListVisible}
        onClose={() => setIsPlayerListVisible(false)}
        allPlayerStates={allPlayerStates}
        isGMView={true} // Indicate this is the GM's view
        serverId={serverId} // Pass serverId for GM actions
      />
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
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    // alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  footerIconText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  genericRollText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "bold",
  },
  gmLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    textTransform: "uppercase",
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
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default GMFooter;
