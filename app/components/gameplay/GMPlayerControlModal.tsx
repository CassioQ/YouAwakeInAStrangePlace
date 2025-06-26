import React, { useState, useEffect, useContext } from "react";
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
import { PlayerGameplayState } from "../../models/GameServer.types";
import StyledInput from "../StyledInput";
import StyledButton from "../StyledButton";
import { AppContext } from "../../contexts/AppContexts";
import {
  updatePlayerCurrentHpGM,
  updatePlayerInterferenceTokensGM,
  updatePlayerIncapacitatedStatusGM,
} from "../../services/gameplayServices";
import { showAppAlert } from "../../utils/alertUtils";

interface GMPlayerControlModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedPlayer: PlayerGameplayState | null; // This is the initial player data when modal opens
  serverId: string;
  gmName: string;
}

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=50";

export const GMPlayerControlModal: React.FC<GMPlayerControlModalProps> = ({
  isVisible,
  onClose,
  selectedPlayer, // Initial data
  serverId,
  gmName,
}) => {
  const context = useContext(AppContext);

  // Local state for input fields
  const [localCurrentHp, setLocalCurrentHp] = useState<string>("");
  const [localInterferenceTokens, setLocalInterferenceTokens] =
    useState<number>(0);

  const [isLoadingHp, setIsLoadingHp] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoadingIncapacitated, setIsLoadingIncapacitated] = useState(false);

  // Derive live player data from context for display purposes
  const livePlayerState =
    selectedPlayer && context?.gameplayState?.playerStates
      ? context.gameplayState.playerStates[selectedPlayer.userId]
      : selectedPlayer; // Fallback to the prop if live data isn't immediately available or player not found

  useEffect(() => {
    // Initialize input fields from the selectedPlayer prop when the modal opens or the prop changes
    if (selectedPlayer) {
      setLocalCurrentHp(String(selectedPlayer.currentHp));
      setLocalInterferenceTokens(selectedPlayer.interferenceTokens);
    } else {
      // Reset if selectedPlayer becomes null (e.g., modal closed and re-opened without a selection)
      setLocalCurrentHp("");
      setLocalInterferenceTokens(0);
    }
  }, [selectedPlayer, isVisible]); // Re-initialize if selectedPlayer prop changes or modal visibility changes

  // If there's no live data (e.g. player removed, or initial load issue), don't render content
  if (!livePlayerState) {
    // Optionally, show a loading or error state if selectedPlayer was initially provided
    // but livePlayerState can't be found. For now, returning null is simplest.
    if (isVisible && selectedPlayer) {
      return (
        <Modal transparent={true} visible={isVisible} onRequestClose={onClose}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, commonStyles.shadow]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 10, color: colors.textSecondary }}>
                Carregando dados do jogador...
              </Text>
            </View>
          </View>
        </Modal>
      );
    }
    return null;
  }

  const handleSaveHp = async () => {
    if (!selectedPlayer) return; // Guard against selectedPlayer being null
    const newHp = parseInt(localCurrentHp, 10);
    if (isNaN(newHp)) {
      showAppAlert("Erro", "Valor de HP inválido.");
      return;
    }
    setIsLoadingHp(true);
    try {
      await updatePlayerCurrentHpGM(
        serverId,
        selectedPlayer.userId,
        newHp,
        gmName,
        livePlayerState.characterName
      );
      showAppAlert(
        "Sucesso",
        `HP de ${livePlayerState.characterName} atualizado para ${newHp}.`
      );
    } catch (error: any) {
      showAppAlert("Erro ao Atualizar HP", error.message);
    } finally {
      setIsLoadingHp(false);
    }
  };

  const handleIncrementToken = () =>
    setLocalInterferenceTokens((prev) => prev + 1);
  const handleDecrementToken = () =>
    setLocalInterferenceTokens((prev) => Math.max(0, prev - 1));

  const handleSaveTokens = async () => {
    if (!selectedPlayer) return;
    setIsLoadingTokens(true);
    try {
      await updatePlayerInterferenceTokensGM(
        serverId,
        selectedPlayer.userId,
        localInterferenceTokens,
        gmName,
        livePlayerState.characterName
      );
      showAppAlert(
        "Sucesso",
        `Tokens de ${livePlayerState.characterName} atualizados para ${localInterferenceTokens}.`
      );
    } catch (error: any) {
      showAppAlert("Erro ao Atualizar Tokens", error.message);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const handleToggleIncapacitated = async () => {
    if (!selectedPlayer) return;
    setIsLoadingIncapacitated(true);
    try {
      // Use livePlayerState.isIncapacitated to determine the *new* state
      await updatePlayerIncapacitatedStatusGM(
        serverId,
        selectedPlayer.userId,
        !livePlayerState.isIncapacitated,
        gmName,
        livePlayerState.characterName
      );
      showAppAlert(
        "Sucesso",
        `Status de ${livePlayerState.characterName} atualizado.`
      );
    } catch (error: any) {
      showAppAlert("Erro ao Atualizar Status", error.message);
    } finally {
      setIsLoadingIncapacitated(false);
    }
  };

  const normalHpPercentage =
    livePlayerState.maxHp > 0
      ? Math.min(100, (livePlayerState.currentHp / livePlayerState.maxHp) * 100)
      : 0;
  const bonusHpPercentage =
    livePlayerState.currentHp > livePlayerState.maxHp
      ? ((livePlayerState.currentHp - livePlayerState.maxHp) /
          livePlayerState.maxHp) *
        100
      : 0;

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
                  livePlayerState.avatarUrl ||
                  defaultAvatar.replace(
                    "name=P",
                    `name=${encodeURIComponent(livePlayerState.characterName[0]) || "P"}`
                  ),
              }}
              style={styles.avatar}
            />
            <Text style={styles.modalTitle}>
              {livePlayerState.characterName}
            </Text>
          </View>

          {/* HP Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pontos de Vida (HP)</Text>
            <View style={styles.hpBarOuter}>
              <View style={styles.hpBarBackground} />
              <View
                style={[
                  styles.hpBarFillNormal,
                  { width: `${normalHpPercentage}%` },
                ]}
              />
              {livePlayerState.currentHp > livePlayerState.maxHp && (
                <View
                  style={[
                    styles.hpBarFillBonus,
                    { width: `${bonusHpPercentage}%` },
                  ]}
                />
              )}
              <Text style={styles.hpTextValue}>
                {livePlayerState.currentHp} / {livePlayerState.maxHp}
              </Text>
            </View>

            <StyledInput
              label="Novo HP Atual"
              value={localCurrentHp}
              onChangeText={setLocalCurrentHp}
              keyboardType="number-pad"
              containerStyle={styles.inputControl}
            />
            <StyledButton
              onPress={handleSaveHp}
              disabled={isLoadingHp}
              props_variant="primary"
              size="small"
            >
              {isLoadingHp ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                "Salvar HP"
              )}
            </StyledButton>
          </View>

          {/* Interference Tokens */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tokens de Interferência: {livePlayerState.interferenceTokens}
            </Text>
            <View style={styles.tokenControl}>
              <TouchableOpacity
                onPress={handleDecrementToken}
                style={styles.tokenButton}
              >
                <Text style={styles.tokenButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.tokenValue}>{localInterferenceTokens}</Text>
              <TouchableOpacity
                onPress={handleIncrementToken}
                style={styles.tokenButton}
              >
                <Text style={styles.tokenButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <StyledButton
              onPress={handleSaveTokens}
              disabled={isLoadingTokens}
              props_variant="primary"
              size="small"
            >
              {isLoadingTokens ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                "Salvar Tokens"
              )}
            </StyledButton>
          </View>

          {/* Incapacitated Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <StyledButton
              onPress={handleToggleIncapacitated}
              disabled={isLoadingIncapacitated}
              props_variant={
                livePlayerState.isIncapacitated ? "secondary" : "primary"
              }
              style={
                livePlayerState.isIncapacitated
                  ? { backgroundColor: colors.error }
                  : {}
              }
              textStyle={
                livePlayerState.isIncapacitated ? { color: colors.white } : {}
              }
              size="small"
            >
              {isLoadingIncapacitated ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : livePlayerState.isIncapacitated ? (
                "Remover Incapacitação"
              ) : (
                "Marcar Incapacitado"
              )}
            </StyledButton>
            {livePlayerState.isIncapacitated && (
              <Text style={styles.incapacitatedText}>
                Jogador está incapacitado.
              </Text>
            )}
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
    maxWidth: 400,
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
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
  },
  hpBarOuter: {
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.hpBackground,
    width: "100%",
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  hpBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.hpBackground,
    borderRadius: 10,
  },
  hpBarFillNormal: {
    height: "100%",
    backgroundColor: colors.hpDefaultFill,
    borderRadius: 10,
    position: "absolute",
    left: 0,
    top: 0,
  },
  hpBarFillBonus: {
    height: "100%",
    backgroundColor: colors.bonusHp,
    borderRadius: 10,
    position: "absolute",
    left: 0,
    top: 0,
  },
  hpTextValue: {
    position: "absolute",
    alignSelf: "center",
    lineHeight: 20,
    fontSize: 12,
    fontWeight: "bold",
    color: colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inputControl: {
    marginBottom: 10,
  },
  tokenControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tokenButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 10,
  },
  tokenButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.secondaryContrast,
  },
  tokenValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: "center",
  },
  incapacitatedText: {
    color: colors.error,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 5,
  },
  closeButtonInternal: {
    marginTop: 10,
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
