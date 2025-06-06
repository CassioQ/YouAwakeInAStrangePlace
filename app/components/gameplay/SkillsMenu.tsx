import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/commonStyles';
import { PlayerSkillModifierChoice } from '../../models/GameServer.types';
import { rollSkillDiceForGameplay } from '../../services/firebaseServices';
import { showAppAlert } from '../../utils/alertUtils';

interface SkillsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  skills: PlayerSkillModifierChoice[];
  serverId: string;
  playerId: string;
  playerName: string;
}

const SkillsMenu: React.FC<SkillsMenuProps> = ({ 
  isVisible, 
  onClose, 
  skills,
  serverId,
  playerId,
  playerName
}) => {
  const [rollingSkillName, setRollingSkillName] = useState<string | null>(null);

  const handleSkillRoll = async (skillName: string, modifier: number) => {
    setRollingSkillName(skillName);
    try {
      await rollSkillDiceForGameplay(serverId, playerId, playerName, skillName, modifier);
      // Optionally show a local confirmation or rely on game log update
    } catch (error: any) {
      showAppAlert("Erro ao Rolar", error.message || "Não foi possível registrar a rolagem.");
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
        onPressOut={onClose} // Close when tapping outside the menu content
      >
        <View style={[styles.menuContainer, commonStyles.shadow]}>
          <View style={styles.handleBarContainer} onTouchEnd={onClose}>
            <View style={styles.handleBar} />
          </View>
          <Text style={styles.menuTitle}>Suas Habilidades</Text>
          <ScrollView contentContainerStyle={styles.skillsList}>
            {skills.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma habilidade atribuída.</Text>
            )}
            {skills.map((skillChoice) => (
              <View key={skillChoice.skillName} style={styles.skillItem}>
                <Text style={styles.skillName}>{skillChoice.skillName}</Text>
                <Text style={styles.skillModifier}>
                  ({skillChoice.modifierValue >= 0 ? '+' : ''}{skillChoice.modifierValue})
                </Text>
                <TouchableOpacity
                  style={[styles.rollButton, commonStyles.dashedBorder]}
                  onPress={() => handleSkillRoll(skillChoice.skillName, skillChoice.modifierValue)}
                  disabled={rollingSkillName === skillChoice.skillName}
                >
                  {rollingSkillName === skillChoice.skillName ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.rollButtonText}>Rolar 2d6</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: colors.backgroundPaper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30, // For safe area or just spacing
    maxHeight: '60%', 
  },
  handleBarContainer: {
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 15,
  },
  skillsList: {
    // paddingBottom: 20,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '500',
  },
  rollButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderColor: colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  rollButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: 20,
    fontStyle: 'italic',
  }
});

export default SkillsMenu;
