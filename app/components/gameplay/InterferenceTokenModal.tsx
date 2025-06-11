import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/commonStyles';
import StyledButton from '../StyledButton';
import { useInterferenceToken } from '../../services/firebaseServices';
import { showAppAlert } from '../../utils/alertUtils';

interface InterferenceTokenModalProps {
  isVisible: boolean;
  onClose: () => void;
  serverId: string;
  playerId: string;
  playerName: string;
  currentTokenCount: number;
}

const InterferenceTokenModal: React.FC<InterferenceTokenModalProps> = ({
  isVisible,
  onClose,
  serverId,
  playerId,
  playerName,
  currentTokenCount,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUseToken = async () => {
    if (currentTokenCount <= 0) {
      showAppAlert("Sem Tokens", "Você não possui tokens de interferência para usar.");
      return;
    }
    setIsLoading(true);
    try {
      await useInterferenceToken(serverId, playerId, playerName);
      showAppAlert("Token Usado!", "Você utilizou um token de interferência na narrativa.");
      onClose(); // Close modal on success
    } catch (error: any) {
      showAppAlert("Erro ao Usar Token", error.message || "Não foi possível usar o token.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <View style={[styles.modalContainer, commonStyles.shadow]} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Tokens de Interferência</Text>
          <Text style={styles.tokenCountText}>Você possui: {currentTokenCount} token(s)</Text>
          
          <StyledButton
            onPress={handleUseToken}
            disabled={isLoading || currentTokenCount <= 0}
            props_variant="primary"
            style={styles.actionButton}
          >
            {isLoading ? <ActivityIndicator color={colors.white} /> : "Utilizar Token"}
          </StyledButton>

          <StyledButton
            props_variant="secondary"
            disabled={true} // For future GM functionality
            style={[styles.actionButton, styles.disabledButton]}
          >
            Adicionar Token (Mestre)
          </StyledButton>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  tokenCountText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  actionButton: {
    width: '100%',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: colors.stone200,
    opacity: 0.7,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  }
});

export default InterferenceTokenModal;