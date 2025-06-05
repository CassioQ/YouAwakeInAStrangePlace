import React, { useContext, useState, useEffect } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native"; // Alert removed
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";
import { showAppAlert } from '../utils/alertUtils'; // Import the utility

const defaultThemeImage =
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3liZXJwdW5rfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60";

const CharacterDevDetailsScreen: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { characterInProgress, updateCharacterInProgress, navigateTo } =
    context;

  const [genre, setGenre] = useState(characterInProgress.genre || "");
  const [adjective, setAdjective] = useState(
    characterInProgress.adjective || ""
  );
  const [location, setLocation] = useState(characterInProgress.location || "");
  const [themeImageURL, setThemeImageURL] = useState(
    characterInProgress.themeImageURL || defaultThemeImage
  );
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setGenre(characterInProgress.genre || "");
    setAdjective(characterInProgress.adjective || "");
    setLocation(characterInProgress.location || "");
    setThemeImageURL(characterInProgress.themeImageURL || defaultThemeImage);
  }, [characterInProgress]);

  const handleNext = () => {
    if (!genre.trim() || !adjective.trim() || !location.trim()) {
      showAppAlert( // Replaced
        "Campos Obrigatórios",
        "Gênero, Adjetivo e Lugar são obrigatórios."
      );
      return;
    }
    updateCharacterInProgress("genre", genre);
    updateCharacterInProgress("adjective", adjective);
    updateCharacterInProgress("location", location);
    updateCharacterInProgress(
      "themeImageURL",
      imageError ? defaultThemeImage : themeImageURL
    ); 
    navigateTo(ScreenEnum.CHARACTER_CREATE_NAME_DESC_SKILL);
  };

  return (
    <ScreenWrapper title="FICHA">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ marginHorizontal: 10 }}
      >
        <View style={[styles.card, commonStyles.shadow]}>
          <Image
            source={{ uri: imageError ? defaultThemeImage : themeImageURL }}
            style={styles.cardMedia}
            resizeMode="cover"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)} 
          />
          <View style={styles.cardContent}>
            <StyledInput
              label="GÊNERO"
              value={genre}
              onChangeText={setGenre}
              placeholder="Ex: Detetive, Explorador"
              autoFocus
            />
            <StyledInput
              label="ADJETIVO"
              value={adjective}
              onChangeText={setAdjective}
              placeholder="Ex: Astuto, Desesperado"
            />
            <StyledInput
              label="LUGAR"
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Cidade neon chuvosa"
            />
            <StyledInput
              label="URL da Imagem Temática (Opcional)"
              value={themeImageURL}
              onChangeText={(text) => {
                setThemeImageURL(text);
                setImageError(false); 
              }}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </View>
        </View>
        <View style={styles.buttonWrapper}>
          <StyledButton
            onPress={handleNext}
            disabled={!genre.trim() || !adjective.trim() || !location.trim()}
            props_variant="primary"
          >
            OK
          </StyledButton>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    overflow: "hidden", 
  },
  cardMedia: {
    height: 180, 
    width: "100%",
    backgroundColor: colors.stone200, 
  },
  cardContent: {
    padding: 16,
  },
  buttonWrapper: {
    marginTop: 24,
  },
});

export default CharacterDevDetailsScreen;
