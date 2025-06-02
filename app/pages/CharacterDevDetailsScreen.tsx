import React, { useContext, useState, useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";

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
    characterInProgress.themeImageURL ||
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3liZXJwdW5rfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"
  );

  useEffect(() => {
    setGenre(characterInProgress.genre || "");
    setAdjective(characterInProgress.adjective || "");
    setLocation(characterInProgress.location || "");
    setThemeImageURL(
      characterInProgress.themeImageURL ||
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3liZXJwdW5rfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"
    );
  }, [characterInProgress]);

  const handleNext = () => {
    updateCharacterInProgress("genre", genre);
    updateCharacterInProgress("adjective", adjective);
    updateCharacterInProgress("location", location);
    updateCharacterInProgress("themeImageURL", themeImageURL);
    navigateTo(ScreenEnum.CHARACTER_CREATE_NAME_DESC_SKILL);
  };

  return (
    <ScreenWrapper title="FICHA" maxWidth="sm">
      <Card elevation={3}>
        <CardMedia
          component="img"
          height="192" // h-48
          image={themeImageURL}
          alt="Imagem Temática"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // prevent infinite loop
            target.src =
              "https://via.placeholder.com/400x200?text=Imagem+Indisponível";
          }}
          sx={{ objectFit: "cover" }}
        />
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <StyledInput
            label="GÊNERO"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Ex: Detetive, Explorador, Rebelde"
            required
            autoFocus
          />
          <StyledInput
            label="ADJETIVO"
            value={adjective}
            onChange={(e) => setAdjective(e.target.value)}
            placeholder="Ex: Astuto, Desesperado, Enigmático"
            required
          />
          <StyledInput
            label="LUGAR"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Uma cidade neon chuvosa, Ruínas antigas, Nave abandonada"
            required
          />
          <StyledInput
            label="URL da Imagem Temática (Opcional)"
            value={themeImageURL}
            onChange={(e) => setThemeImageURL(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
          />
        </CardContent>
      </Card>
      <Box sx={{ mt: 3 }}>
        <StyledButton
          onClick={handleNext}
          disabled={!genre.trim() || !adjective.trim() || !location.trim()}
          props_variant="primary"
        >
          OK
        </StyledButton>
      </Box>
    </ScreenWrapper>
  );
};

export default CharacterDevDetailsScreen;
