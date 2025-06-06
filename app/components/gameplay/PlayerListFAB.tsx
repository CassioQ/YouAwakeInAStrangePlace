import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/commonStyles';
import { PlayerGameplayState } from '../../models/GameServer.types';

interface PlayerListFABProps {
  players: PlayerGameplayState[];
}

const defaultAvatar = "https://ui-avatars.com/api/?name=P&background=random&size=30";

const PlayerListFAB: React.FC<PlayerListFABProps> = ({ players }) => {
  const [isPlayerListVisible, setIsPlayerListVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, commonStyles.shadow]}
        onPress={() => setIsPlayerListVisible(true)}
        accessibilityLabel="Mostrar lista de jogadores"
      >
        <Text style={styles.fabIcon}>👥</Text> 
      </TouchableOpacity>

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
          <View style={[styles.playerListContainer, commonStyles.shadow]}>
            <Text style={styles.playerListTitle}>Jogadores na Sessão ({players.length})</Text>
            <FlatList
              data={players}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <View style={styles.playerItem}>
                  <Image 
                    source={{ uri: item.avatarUrl || defaultAvatar.replace("name=P", `name=${encodeURIComponent(item.characterName[0]) || 'J'}`) }} 
                    style={styles.playerAvatar}
                  />
                  <View>
                    <Text style={styles.playerName}>{item.characterName}</Text>
                    <Text style={styles.playerHp}>HP: {item.currentHp}/{item.maxHp}</Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
             <TouchableOpacity style={styles.closeButton} onPress={() => setIsPlayerListVisible(false)}>
                <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 15,
    top: 15, 
    backgroundColor: colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fabIcon: {
    fontSize: 22,
    color: colors.primaryContrast,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerListContainer: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 10,
    padding: 15,
    width: '85%',
    maxHeight: '70%',
  },
  playerListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    backgroundColor: colors.stone200,
  },
  playerName: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  playerHp: {
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
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.secondaryContrast,
    fontWeight: '500',
  }
});

export default PlayerListFAB;
