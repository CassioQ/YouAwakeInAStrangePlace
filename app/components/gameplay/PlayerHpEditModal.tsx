import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import StyledInput from "../StyledInput";
import StyledButton from "../StyledButton";
import { updatePlayerCurrentHpSelf } from "../../services/gameplayServices";
import { showAppAlert } from "../../utils/alertUtils";

interface PlayerHpEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  characterName: string;
  currentHp: number;
  maxHp: number;
  avatarUrl?: string;
  serverId: string;
  playerId: string;
  playerName: string;
}

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=50";

const PlayerHpEditModal: React.FC<PlayerHpEditModalProps> = ({
  isVisible,
  onClose,
  characterName,
  currentHp,
  maxHp,
  avatarUrl,
  serverId,
  playerId,
  playerName,
}) => {
  const [localCurrentHp, setLocalCurrentHp] = useState<string>(
    String(currentHp)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setLocalCurrentHp(String(currentHp));
    }
  }, [currentHp, isVisible]);

  const handleSaveHp = async () => {
    const newHp = parseInt(localCurrentHp, 10);
    if (isNaN(newHp)) {
      showAppAlert("Erro", "Valor de HP inválido.");
      return;
    }
    setIsLoading(true);
    try {
      await updatePlayerCurrentHpSelf(serverId, playerId, newHp, playerName);
      showAppAlert(
        "Sucesso",
        `Seus Pontos de Vida foram atualizados para ${newHp}.`
      );
      onClose();
    } catch (error: any) {
      showAppAlert("Erro ao Atualizar HP", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const normalHpPercentage =
    maxHp > 0 ? Math.min(100, (currentHp / maxHp) * 100) : 0;
  const bonusHpPercentage =
    currentHp > maxHp ? ((currentHp - maxHp) / maxHp) * 100 : 0;

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
          style={[styles.modalContainer, commonStyles.shadow]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.playerHeader}>
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
            <Text style={styles.modalTitle}>{characterName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Gerenciar Pontos de Vida (HP)
            </Text>

            <View style={styles.hpBarOuter}>
              <View style={styles.hpBarBackground} />
              <View
                style={[
                  styles.hpBarFillNormal,
                  { width: `${normalHpPercentage}%` },
                ]}
              />
              {currentHp > maxHp && (
                <View
                  style={[
                    styles.hpBarFillBonus,
                    { width: `${bonusHpPercentage}%` },
                  ]}
                />
              )}
              <Text style={styles.hpTextValue}>
                {currentHp} / {maxHp}
              </Text>
            </View>

            <StyledInput
              label="Seu HP Atual"
              value={localCurrentHp}
              onChangeText={setLocalCurrentHp}
              keyboardType="number-pad"
              containerStyle={styles.inputControl}
              autoFocus
            />
            <StyledButton
              onPress={handleSaveHp}
              disabled={isLoading}
              props_variant="primary"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                "Salvar HP"
              )}
            </StyledButton>
          </View>

          <TouchableOpacity
            style={styles.closeButtonInternal}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 380,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.stone200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 10, // Reduced bottom margin
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  hpBarOuter: {
    height: 22, // Slightly taller
    borderRadius: 11,
    backgroundColor: colors.hpBackground,
    width: "100%",
    marginBottom: 15, // Spacing before input
    position: "relative",
    overflow: "hidden",
  },
  hpBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.hpBackground,
    borderRadius: 11,
  },
  hpBarFillNormal: {
    height: "100%",
    backgroundColor: colors.hpDefaultFill,
    borderRadius: 11,
    position: "absolute",
    left: 0,
    top: 0,
  },
  hpBarFillBonus: {
    height: "100%",
    backgroundColor: colors.bonusHp,
    borderRadius: 11,
    position: "absolute",
    left: 0,
    top: 0,
  },
  hpTextValue: {
    position: "absolute",
    alignSelf: "center",
    lineHeight: 22, // Match bar height
    fontSize: 12,
    fontWeight: "bold",
    color: colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inputControl: {
    marginBottom: 15,
  },
  closeButtonInternal: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: colors.stone300,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontWeight: "500",
    fontSize: 16,
  },
});

export default PlayerHpEditModal;
