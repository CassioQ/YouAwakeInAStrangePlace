import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/commonStyles';
import { DefinedSkill } from '../../models/GameServer.types';
import { rollGmSkillForGameplay } from '../../services/firebaseServices';
import { showAppAlert } from '../../utils/alertUtils';

interface GMSkillsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  gmSkills: DefinedSkill[]; 
  serverId: string;
  gmId: string;
  gmName: string;
}

const GMSkillsMenu: React.FC<GMSkillsMenuProps> = ({ 
  isVisible, 
  onClose, 
  gmSkills,
  serverId,
  gmId,
  gmName
}) => {
  const [rollingSkillName, setRollingSkillName] = useState<string | null>(null);

  const handleSkillRoll = async (skillName: string) => {
    setRollingSkillName(skillName);
    try {
      await rollGmSkillForGameplay(serverId, gmId, gmName, skillName);
      // Log entry is handled in the service, no need to alert success for each roll.
    } catch (error: any) {
      showAppAlert("Erro ao Rolar Habilidade do Mestre", error.message || "Não foi possível registrar a rolagem.");
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
        <View style={[styles.menuContainer, commonStyles.shadow]} onStartShouldSetResponder={() => true}>
          <View style={styles.handleBarContainer} onTouchEnd={onClose}>
            <View style={styles.handleBar} />
          </View>
          <Text style={styles.menuTitle}>Habilidades do Mestre</Text>
          <ScrollView contentContainerStyle={styles.skillsList}>
            {gmSkills.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma habilidade de mestre definida.</Text>
            )}
            {gmSkills.map((skill) => (
              <View key={skill.skillName} style={styles.skillItem}>
                <Text style={styles.skillName}>{skill.skillName}</Text>
                <TouchableOpacity
                  style={[styles.rollButton, commonStyles.dashedBorder]}
                  onPress={() => handleSkillRoll(skill.skillName)}
                  disabled={rollingSkillName === skill.skillName}
                >
                  {rollingSkillName === skill.skillName ? (
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
    paddingBottom: 30, 
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
  skillsList: {},
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

export default GMSkillsMenu;
