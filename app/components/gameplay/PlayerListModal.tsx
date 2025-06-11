import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import {
  PlayerGameplayState,
  PlayerSkillModifierChoice,
} from "../../models/GameServer.types";
import GMPlayerControlModal from "./GMPlayerControlModal";
import { AppContext } from "../../contexts/AppContexts";

interface PlayerListModalProps {
  isVisible: boolean;
  onClose: () => void;
  allPlayerStates: PlayerGameplayState[];
  isGMView?: boolean; // To differentiate between player and GM view of this modal
  serverId?: string; // Needed if GM can edit from here
  // gmName?: string; // Will get from context if needed for GMPlayerControlModal
}

const defaultPlayerAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=40";

const PlayerListModal: React.FC<PlayerListModalProps> = ({
  isVisible,
  onClose,
  allPlayerStates,
  isGMView = false,
  serverId,
}) => {
  const [isGMControlModalVisible, setIsGMControlModalVisible] = useState(false);
  const [selectedPlayerForGM, setSelectedPlayerForGM] =
    useState<PlayerGameplayState | null>(null);
  const context = useContext(AppContext);
  const gmName = context?.currentUser?.displayName || "Mestre";

  const handlePlayerPress = (player: PlayerGameplayState) => {
    if (isGMView && serverId) {
      setSelectedPlayerForGM(player);
      setIsGMControlModalVisible(true);
    }
    // If not GM view, or no serverId, pressing does nothing or could show basic info
  };

  const renderSkills = (skills: PlayerSkillModifierChoice[]) => {
    if (!skills || skills.length === 0) {
      return (
        <Text style={styles.skillDetailText}>
          Nenhuma habilidade atribuída.
        </Text>
      );
    }
    return skills.map((skill) => (
      <Text key={skill.skillName} style={styles.skillDetailText}>
        - {skill.skillName} ({skill.modifierValue >= 0 ? "+" : ""}
        {skill.modifierValue})
      </Text>
    ));
  };

  return (
    <>
      <Modal
        animationType="fade"
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
            style={[styles.modalContainer, commonStyles.shadow]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>
              Jogadores na Sessão ({allPlayerStates.length})
            </Text>
            <FlatList
              data={allPlayerStates}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.playerItemContainer,
                    commonStyles.dashedBorder,
                    item.isIncapacitated && styles.incapacitatedPlayer, // Style for incapacitated
                  ]}
                  onPress={() => handlePlayerPress(item)}
                  disabled={!isGMView} // Only GM can press to open detail modal
                >
                  <View style={styles.playerHeader}>
                    <Image
                      source={{
                        uri:
                          item.avatarUrl ||
                          defaultPlayerAvatar.replace(
                            "name=P",
                            `name=${encodeURIComponent(item.characterName[0]) || "P"}`
                          ),
                      }}
                      style={styles.playerAvatar}
                    />
                    <View style={styles.playerNameHpContainer}>
                      <Text style={styles.modalPlayerName}>
                        {item.characterName}{" "}
                        {item.isIncapacitated ? "(Incapacitado)" : ""}
                      </Text>
                      <Text style={styles.modalPlayerHp}>
                        HP: {item.currentHp} / {item.maxHp}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.skillsHeader}>
                    Habilidades Atribuídas:
                  </Text>
                  {renderSkills(item.assignedSkills)}
                  <Text style={styles.tokenInfoText}>
                    Tokens de Interferência: {item.interferenceTokens}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.closeButtonInternal}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {isGMView && serverId && selectedPlayerForGM && (
        <GMPlayerControlModal
          isVisible={isGMControlModalVisible}
          onClose={() => {
            setIsGMControlModalVisible(false);
            setSelectedPlayerForGM(null);
          }}
          selectedPlayer={selectedPlayerForGM}
          serverId={serverId}
          gmName={gmName}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 10,
    padding: 15,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  playerItemContainer: {
    padding: 10,
    backgroundColor: colors.stone100,
    borderRadius: 6,
    marginBottom: 8,
    borderColor: colors.divider,
  },
  incapacitatedPlayer: {
    backgroundColor: colors.stone200,
    opacity: 0.7,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.stone200,
  },
  playerNameHpContainer: {
    flex: 1,
  },
  modalPlayerName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  modalPlayerHp: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  skillsHeader: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 5,
    marginBottom: 3,
  },
  skillDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 10,
  },
  tokenInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 5,
  },
  separator: {
    height: 0,
  },
  closeButtonInternal: {
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

export default PlayerListModal;
