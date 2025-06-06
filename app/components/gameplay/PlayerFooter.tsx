import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/commonStyles';
import SkillsMenu from './SkillsMenu'; // Will be created next
import { PlayerSkillModifierChoice } from '../../models/GameServer.types';

interface PlayerFooterProps {
  characterName: string;
  currentHp: number;
  maxHp: number;
  skills: PlayerSkillModifierChoice[];
  avatarUrl?: string; // Placeholder for now
  serverId: string;
  playerId: string;
  playerName: string;
}

const defaultAvatar = "https://ui-avatars.com/api/?name=P&background=random&size=40";

const PlayerFooter: React.FC<PlayerFooterProps> = ({
  characterName,
  currentHp,
  maxHp,
  skills,
  avatarUrl,
  serverId,
  playerId,
  playerName
}) => {
  const [isSkillsMenuVisible, setIsSkillsMenuVisible] = useState(false);

  const hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;

  return (
    <>
      <View style={[styles.footerContainer, commonStyles.shadow]}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl || defaultAvatar.replace("name=P", `name=${encodeURIComponent(characterName[0]) || 'P'}`) }} 
            style={styles.avatar} 
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.characterName} numberOfLines={1}>{characterName}</Text>
          <View style={styles.hpBarContainer}>
            <View style={[styles.hpBarFill, { width: `${hpPercentage}%` }]} />
            <Text style={styles.hpText}>{`${currentHp} / ${maxHp} HP`}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.skillsButton} 
          onPress={() => setIsSkillsMenuVisible(true)}
          accessibilityLabel="Abrir menu de habilidades"
        >
          <Text style={styles.skillsButtonText}>H</Text> 
        </TouchableOpacity>
      </View>

      <SkillsMenu
        isVisible={isSkillsMenuVisible}
        onClose={() => setIsSkillsMenuVisible(false)}
        skills={skills}
        serverId={serverId}
        playerId={playerId}
        playerName={playerName}
      />
    </>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundPaper,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    height: 65, 
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.stone200, // Placeholder color
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  characterName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  hpBarContainer: {
    height: 18,
    backgroundColor: colors.stone300,
    borderRadius: 9,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 9,
  },
  hpText: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: colors.white, // Or a contrasting color if HP bar is light
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  skillsButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    ...commonStyles.shadow,
  },
  skillsButtonText: {
    color: colors.primaryContrast,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PlayerFooter;
