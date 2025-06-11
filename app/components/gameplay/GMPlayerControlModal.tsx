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
} from "../../services/firebaseServices";
import { showAppAlert } from "../../utils/alertUtils";

interface GMPlayerControlModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedPlayer: PlayerGameplayState | null;
  serverId: string;
  gmName: string;
}

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=50";

const GMPlayerControlModal: React.FC<GMPlayerControlModalProps> = ({
  isVisible,
  onClose,
  selectedPlayer,
  serverId,
  gmName,
}) => {
  const [localCurrentHp, setLocalCurrentHp] = useState<string>("");
  const [localInterferenceTokens, setLocalInterferenceTokens] =
    useState<number>(0);
  // localIsIncapacitated is derived directly from selectedPlayer.isIncapacitated for the toggle

  const [isLoadingHp, setIsLoadingHp] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoadingIncapacitated, setIsLoadingIncapacitated] = useState(false);

  const context = useContext(AppContext);

  useEffect(() => {
    if (selectedPlayer) {
      setLocalCurrentHp(String(selectedPlayer.currentHp));
      setLocalInterferenceTokens(selectedPlayer.interferenceTokens);
    } else {
      setLocalCurrentHp("");
      setLocalInterferenceTokens(0);
    }
  }, [selectedPlayer, isVisible]);

  if (!selectedPlayer) return null;

  const handleSaveHp = async () => {
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
        selectedPlayer.characterName
      );
      showAppAlert(
        "Sucesso",
        `HP de ${selectedPlayer.characterName} atualizado para ${newHp}.`
      );
      // The modal will reflect the change once Firestore updates propagate
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
    setIsLoadingTokens(true);
    try {
      await updatePlayerInterferenceTokensGM(
        serverId,
        selectedPlayer.userId,
        localInterferenceTokens,
        gmName,
        selectedPlayer.characterName
      );
      showAppAlert(
        "Sucesso",
        `Tokens de ${selectedPlayer.characterName} atualizados para ${localInterferenceTokens}.`
      );
    } catch (error: any) {
      showAppAlert("Erro ao Atualizar Tokens", error.message);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const handleToggleIncapacitated = async () => {
    setIsLoadingIncapacitated(true);
    try {
      await updatePlayerIncapacitatedStatusGM(
        serverId,
        selectedPlayer.userId,
        !selectedPlayer.isIncapacitated,
        gmName,
        selectedPlayer.characterName
      );
      showAppAlert(
        "Sucesso",
        `Status de ${selectedPlayer.characterName} atualizado.`
      );
    } catch (error: any) {
      showAppAlert("Erro ao Atualizar Status", error.message);
    } finally {
      setIsLoadingIncapacitated(false);
    }
  };

  const normalHpPercentage =
    Math.min(1, selectedPlayer.currentHp / selectedPlayer.maxHp) * 100;
  const bonusHpPercentage =
    selectedPlayer.currentHp > selectedPlayer.maxHp
      ? ((selectedPlayer.currentHp - selectedPlayer.maxHp) /
          selectedPlayer.maxHp) *
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
                  selectedPlayer.avatarUrl ||
                  defaultAvatar.replace(
                    "name=P",
                    `name=${encodeURIComponent(selectedPlayer.characterName[0]) || "P"}`
                  ),
              }}
              style={styles.avatar}
            />
            <Text style={styles.modalTitle}>
              {selectedPlayer.characterName}
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
                  { width: `${Math.min(100, normalHpPercentage)}%` },
                ]}
              />
              {selectedPlayer.currentHp > selectedPlayer.maxHp && (
                <View
                  style={[
                    styles.hpBarFillBonus,
                    // This bonus bar overlays the start of the normal bar
                    // Its width represents the amount *over* maxHp
                    { width: `${Math.min(100, bonusHpPercentage)}%` },
                  ]}
                />
              )}
              <Text style={styles.hpTextValue}>
                {selectedPlayer.currentHp} / {selectedPlayer.maxHp}
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
            <Text style={styles.sectionTitle}>Tokens de Interferência</Text>
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
                selectedPlayer.isIncapacitated ? "secondary" : "primary"
              }
              style={
                selectedPlayer.isIncapacitated
                  ? { backgroundColor: colors.error }
                  : {}
              }
              textStyle={
                selectedPlayer.isIncapacitated ? { color: colors.white } : {}
              }
              size="small"
            >
              {isLoadingIncapacitated ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : selectedPlayer.isIncapacitated ? (
                "Remover Incapacitação"
              ) : (
                "Marcar Incapacitado"
              )}
            </StyledButton>
            {selectedPlayer.isIncapacitated && (
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
    backgroundColor: colors.hpBackground, // Use new color
    width: "100%",
    marginBottom: 10,
    position: "relative", // For absolute positioning of text
    overflow: "hidden", // Ensures bonus bar doesn't make container visually larger
  },
  hpBarBackground: {
    // This is the track
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.hpBackground, // e.g., a light grey
    borderRadius: 10,
  },
  hpBarFillNormal: {
    height: "100%",
    backgroundColor: colors.hpDefaultFill, // e.g., green
    borderRadius: 10,
    position: "absolute",
    left: 0,
    top: 0,
  },
  hpBarFillBonus: {
    // This overlays the start of the normal fill
    height: "100%",
    backgroundColor: colors.bonusHp, // e.g., blue or gold
    borderRadius: 10,
    position: "absolute",
    left: 0, // Starts from the beginning, overlays normal fill
    top: 0,
  },
  hpTextValue: {
    position: "absolute",
    alignSelf: "center",
    lineHeight: 20, // Match bar height
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

export default GMPlayerControlModal;
