import React, { useContext, useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledButton from "../components/StyledButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { AppContext } from "../contexts/AppContexts";
import { Skill } from "../models/Character.types";
import { CharacterSheetTab, ScreenEnum } from "../models/enums/CommomEnuns";

const CharacterSheetScreen: React.FC = () => {
  const context = useContext(AppContext);
  const [activeTabValue, setActiveTabValue] = useState<CharacterSheetTab>(
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
      <ScreenWrapper title="FICHA" maxWidth="sm">
        <Paper elevation={3} sx={{ textAlign: "center", p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Nenhum personagem carregado.
          </Typography>
          <StyledButton
            onClick={() => navigateTo(ScreenEnum.HOME)}
            props_variant="primary"
          >
            Voltar ao Início
          </StyledButton>
        </Paper>
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
    alert(
      `Rolando ${skill.name} (Modificador: ${skill.modifier}). Resultado: ${Math.floor(Math.random() * 20) + 1 + skill.modifier}`
    );
  };

  const handleReturnHome = () => {
    resetCharacterInProgress();
    setCreatedCharacter(null);
    setUserRole(null);
    navigateTo(ScreenEnum.HOME);
  };

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: CharacterSheetTab
  ) => {
    setActiveTabValue(newValue);
  };

  const renderTabContent = () => {
    switch (activeTabValue) {
      case CharacterSheetTab.SKILLS:
        return (
          <List dense sx={{ bgcolor: "background.paper", py: 0 }}>
            {skills.length > 0 ? (
              skills.map((skill) => (
                <ListItem
                  key={skill.id}
                  secondaryAction={
                    <StyledButton
                      props_variant="secondary"
                      onClick={() => handleRollSkill(skill)}
                      size="small"
                      sx={{ minWidth: "auto", px: 1.5, py: 0.5 }} // smaller button
                    >
                      Rolar
                    </StyledButton>
                  }
                  sx={{
                    mb: 1,
                    bgcolor: "stone.100",
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          skill.modifier >= 0 ? "success.main" : "error.main",
                        width: 32,
                        height: 32,
                        fontSize: "0.875rem",
                      }}
                    >
                      {skill.modifier >= 0
                        ? `+${skill.modifier}`
                        : skill.modifier}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={skill.name}
                    primaryTypographyProps={{
                      fontWeight: "medium",
                      color: "text.primary",
                    }}
                  />
                </ListItem>
              ))
            ) : (
              <Typography
                sx={{ p: 2, fontStyle: "italic", color: "text.secondary" }}
              >
                Nenhuma habilidade definida.
              </Typography>
            )}
          </List>
        );
      case CharacterSheetTab.ITEMS:
        return (
          <Stack spacing={1.5} sx={{ p: 1 }}>
            {items.length > 0 ? (
              items.map((item) => (
                <Paper
                  key={item.id}
                  elevation={1}
                  sx={{ p: 1.5, bgcolor: "stone.100" }}
                >
                  <Typography
                    variant="subtitle1"
                    component="h4"
                    fontWeight="medium"
                  >
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Typography
                sx={{ p: 1, fontStyle: "italic", color: "text.secondary" }}
              >
                Nenhum item no inventário.
              </Typography>
            )}
          </Stack>
        );
      case CharacterSheetTab.OBJECTIVE:
        return (
          <Typography
            sx={{ p: 2, whiteSpace: "pre-wrap", color: "text.primary" }}
          >
            {objective || "Nenhum objetivo definido."}
          </Typography>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenWrapper title="FICHA" maxWidth="sm">
      <Card elevation={3}>
        {themeImageURL && (
          <CardMedia
            component="img"
            height="160" // h-40
            image={themeImageURL}
            alt={`Tema de ${name}`}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none"; // Hide if image fails
            }}
            sx={{ objectFit: "cover" }}
          />
        )}
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            {avatarUrl && (
              <Avatar
                src={avatarUrl}
                alt={name}
                sx={{
                  width: 80,
                  height: 80,
                  mr: 2,
                  border: `2px solid ${"palette.divider"}`,
                }}
              />
            )}
            <Box>
              <Typography
                variant="h4"
                component="h2"
                fontWeight="bold"
                color="text.primary"
              >
                {name}
              </Typography>
              {playerName && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: -0.5 }}
                >
                  {playerName}
                </Typography>
              )}
            </Box>
          </Box>

          {description && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                mb: 2.5,
                bgcolor: "background.default", // stone-50
                borderColor: "divider", // stone-300
                borderStyle: "dashed",
                borderWidth: "2px",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Paper>
          )}

          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={activeTabValue}
              onChange={handleTabChange}
              aria-label="Abas da Ficha de Personagem"
              variant="fullWidth" // Ensure tabs take full width
              indicatorColor="primary"
              textColor="primary"
            >
              {Object.values(CharacterSheetTab).map((tab) => (
                <Tab key={tab} label={tab} value={tab} sx={{ px: 1 }} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ minHeight: 150 }}>{renderTabContent()}</Box>
        </CardContent>
      </Card>
      <Box sx={{ mt: 3 }}>
        <StyledButton onClick={handleReturnHome} props_variant="secondary">
          Voltar ao Início / Criar Novo
        </StyledButton>
      </Box>
    </ScreenWrapper>
  );
};

export default CharacterSheetScreen;
