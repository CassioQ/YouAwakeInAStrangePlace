import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledButton from "../components/StyledButton";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { CharacterSheetTab, ScreenEnum } from "../models/enums/CommomEnuns";
import { Skill } from "../models/Character.types";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=P&background=random&size=100"; // Fallback avatar
const defaultThemeImage = "https://via.placeholder.com/400x200?text=Tema";

const CharacterSheetScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<CharacterSheetTab>(
    CharacterSheetTab.SKILLS
  );

  if (!context) return null;
  const {
    createdCharacter,
    navigateTo,
    resetCharacterInProgress,
    setUserRole,
    setCreatedCharacter,
  } = context;

  if (!createdCharacter) {
    return (
      <ScreenWrapper title="FICHA">
        <View
          style={[
            styles.paperMessage,
            commonStyles.shadow,
            { marginHorizontal: 10 },
          ]}
        >
          <Text style={styles.messageText}>Nenhum personagem carregado.</Text>
          <StyledButton
            onPress={() => navigateTo(ScreenEnum.HOME)}
            props_variant="primary"
          >
            Voltar ao Início
          </StyledButton>
        </View>
      </ScreenWrapper>
    );
  }

  const {
    name,
    playerName,
    description,
    avatarUrl,
    themeImageURL,
    skills,
    items,
    objective,
  } = createdCharacter;

  const handleRollSkill = (skill: Skill) => {
    Alert.alert(
      `Rolando ${skill.name}`,
      `Modificador: ${skill.modifier}\nResultado: ${Math.floor(Math.random() * 20) + 1 + skill.modifier}`
    );
  };

  const handleReturnHome = () => {
    resetCharacterInProgress();
    setCreatedCharacter(null);
    setUserRole(null);
    navigateTo(ScreenEnum.HOME);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case CharacterSheetTab.SKILLS:
        return (
          <View style={styles.tabContentContainer}>
            {skills.length > 0 ? (
              skills.map((skill) => (
                <View
                  id={skill.id}
                  style={[styles.listItem, commonStyles.shadow]}
                >
                  <View
                    style={[
                      styles.skillModifierCircle,
                      {
                        backgroundColor:
                          skill.modifier >= 0 ? colors.success : colors.error,
                      },
                    ]}
                  >
                    <Text style={styles.skillModifierText}>
                      {skill.modifier >= 0
                        ? `+${skill.modifier}`
                        : skill.modifier}
                    </Text>
                  </View>
                  <Text style={styles.listItemTextPrimary}>{skill.name}</Text>
                  <StyledButton
                    props_variant="secondary"
                    onPress={() => handleRollSkill(skill)}
                    size="small"
                    style={styles.rollButton}
                    textStyle={styles.rollButtonText}
                  >
                    Rolar
                  </StyledButton>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>
                Nenhuma habilidade definida.
              </Text>
            )}
          </View>
        );
      case CharacterSheetTab.ITEMS:
        return (
          <View style={styles.tabContentContainer}>
            {items.length > 0 ? (
              items.map((item) => (
                <View
                  id={item.id}
                  style={[styles.itemCard, commonStyles.shadow]}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>
                Nenhum item no inventário.
              </Text>
            )}
          </View>
        );
      case CharacterSheetTab.OBJECTIVE:
        return (
          <Text style={[styles.tabContentContainer, styles.objectiveText]}>
            {objective || "Nenhum objetivo definido."}
          </Text>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenWrapper title="FICHA">
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        style={{ marginHorizontal: 10 }}
      >
        <View style={[styles.card, commonStyles.shadow]}>
          {themeImageURL && (
            <Image
              source={{ uri: themeImageURL || defaultThemeImage }}
              style={styles.themeImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.cardContent}>
            <View style={styles.headerInfo}>
              <Image
                source={{ uri: avatarUrl || defaultAvatar }}
                style={styles.avatar}
              />
              <View style={styles.nameContainer}>
                <Text style={styles.characterName}>{name}</Text>
                {playerName && (
                  <Text style={styles.playerName}>{playerName}</Text>
                )}
              </View>
            </View>

            {description && (
              <View style={[styles.descriptionBox, commonStyles.dashedBorder]}>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}

            <View style={styles.tabsContainer}>
              {Object.values(CharacterSheetTab).map((tabName) => (
                <TouchableOpacity
                  key={tabName}
                  style={[
                    styles.tabButton,
                    activeTab === tabName && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab(tabName)}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tabName && styles.activeTabButtonText,
                    ]}
                  >
                    {tabName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tabRenderContent}>{renderTabContent()}</View>
          </View>
        </View>
        <View style={styles.homeButtonWrapper}>
          <StyledButton onPress={handleReturnHome} props_variant="secondary">
            Voltar ao Início / Criar Novo
          </StyledButton>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContentContainer: {
    paddingBottom: 20,
  },
  paperMessage: {
    backgroundColor: colors.backgroundPaper,
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 16,
    color: colors.textPrimary,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    overflow: "hidden",
  },
  themeImage: {
    height: 160,
    width: "100%",
    backgroundColor: colors.stone200,
  },
  cardContent: {
    padding: 12,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.stone200,
  },
  nameContainer: {
    flex: 1,
  },
  characterName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  playerName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -4,
  },
  descriptionBox: {
    padding: 10,
    marginBottom: 16,
    backgroundColor: colors.backgroundDefault,
    borderColor: colors.inputBorder, // from commonStyles.dashedBorder
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 8, // Smaller padding for more tabs
    flex: 1, // Ensure tabs distribute width
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  activeTabButtonText: {
    color: colors.primary,
  },
  tabRenderContent: {
    minHeight: 150,
  },
  tabContentContainer: {
    padding: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.stone100,
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  skillModifierCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  skillModifierText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  listItemTextPrimary: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  rollButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 0, // Override default
  },
  rollButtonText: {
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: colors.stone100,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  objectiveText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    padding: 8,
  },
  emptyStateText: {
    padding: 16,
    fontStyle: "italic",
    textAlign: "center",
    color: colors.textSecondary,
  },
  homeButtonWrapper: {
    marginTop: 24,
  },
});

export default CharacterSheetScreen;
