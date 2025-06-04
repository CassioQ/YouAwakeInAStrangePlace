import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/commonStyles";
import { AppContext } from "../../contexts/AppContexts";
import { PlayerInLobby, GameServer } from "../../models/GameServer.types";
import {
  listenToLobbyPlayers,
  getGameServerDetails,
} from "../../services/firebaseServices";
import { ScreenEnum } from "../../models/enums/CommomEnuns";
import { Unsubscribe } from "firebase/firestore";
import StyledButton from "../../components/StyledButton"; // Import StyledButton

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=60";

const GMLobbyScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [serverDetails, setServerDetails] = useState<GameServer | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInLobby[]>([]);
  const [loadingServer, setLoadingServer] = useState(true);

  if (!context) return null;
  const { activeServerDetails, navigateTo, setActiveServerDetails } = context;

  useEffect(() => {
    let unsubscribePlayerListener: Unsubscribe | null = null;

    const fetchAndListen = async () => {
      if (activeServerDetails?.id) {
        setLoadingServer(true);
        // Fetch initial details once if not fully populated or to confirm
        const details = await getGameServerDetails(activeServerDetails.id);
        if (details) {
          setServerDetails(details);
          // Set up listener for players
          unsubscribePlayerListener = listenToLobbyPlayers(
            activeServerDetails.id,
            (players) => {
              setLobbyPlayers(players);
            }
          );
        } else {
          Alert.alert(
            "Erro",
            "Não foi possível carregar os detalhes do servidor."
          );
          navigateTo(ScreenEnum.HOME); // Or CREATE_SERVER
        }
        setLoadingServer(false);
      } else {
        Alert.alert("Erro", "Nenhum servidor ativo selecionado.");
        navigateTo(ScreenEnum.CREATE_SERVER);
      }
    };

    fetchAndListen();

    return () => {
      if (unsubscribePlayerListener) {
        unsubscribePlayerListener();
      }
    };
  }, [activeServerDetails?.id, navigateTo]);

  const handleReturnHome = () => {
    setActiveServerDetails(null); // Clear active server when GM leaves lobby
    navigateTo(ScreenEnum.HOME);
  };

  if (loadingServer) {
    return (
      <ScreenWrapper title="LOBBY DO MESTRE">
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando lobby...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!serverDetails) {
    return (
      <ScreenWrapper title="LOBBY DO MESTRE">
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>
            Detalhes do servidor não encontrados.
          </Text>
          <StyledButton onPress={handleReturnHome} props_variant="primary">
            Voltar
          </StyledButton>
        </View>
      </ScreenWrapper>
    );
  }

  const renderPlayerItem = ({ item }: { item: PlayerInLobby }) => (
    <View style={[styles.playerCard, commonStyles.shadow]}>
      <Image
        source={{ uri: item.avatarUrl || defaultAvatar }}
        style={styles.playerAvatar}
      />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.playerName}</Text>
        <Text style={styles.characterName}>
          Personagem: {item.characterName}
        </Text>
        <Text style={styles.skillsTitle}>Habilidades:</Text>
        {item.skills.map((skill, index) => (
          <Text key={index} style={styles.skillText}>
            - {skill.name} (
            {skill.modifier >= 0 ? `+${skill.modifier}` : skill.modifier})
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenWrapper title="LOBBY DO MESTRE">
      <View style={styles.container}>
        <View
          style={[
            styles.serverInfoBox,
            commonStyles.dashedBorder,
            commonStyles.shadow,
          ]}
        >
          <Text style={styles.infoLabel}>Nome do Servidor:</Text>
          <Text style={styles.infoValue}>{serverDetails.serverName}</Text>
          <Text style={styles.infoLabel}>Senha:</Text>
          <Text style={styles.infoValue}>
            {serverDetails.password || "(Servidor Aberto)"}
          </Text>
        </View>

        <Text style={styles.playersHeader}>
          Jogadores no Lobby ({lobbyPlayers.length})
        </Text>
        {lobbyPlayers.length === 0 ? (
          <Text style={styles.emptyLobbyText}>Aguardando jogadores...</Text>
        ) : (
          <FlatList
            data={lobbyPlayers}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item.userId + "_" + item.characterId} // Ensure unique key
            contentContainerStyle={styles.playerList}
          />
        )}
        <StyledButton
          onPress={handleReturnHome}
          props_variant="secondary"
          style={{ marginTop: 20 }}
        >
          Fechar Lobby e Voltar
        </StyledButton>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  serverInfoBox: {
    backgroundColor: colors.backgroundPaper,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "bold",
    marginBottom: 8,
    paddingLeft: 5,
  },
  playersHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 5,
  },
  playerList: {
    paddingBottom: 10,
  },
  playerCard: {
    backgroundColor: colors.stone100,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: colors.stone200,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  characterName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 5,
  },
  skillText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  emptyLobbyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default GMLobbyScreen;
