import React, { useState, useContext } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import StyledInput from "../components/StyledInput";
import StyledButton from "../components/StyledButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";

const AccessScreen: React.FC = () => {
  const [serverName, setServerName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const context = useContext(AppContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentativa de acesso ao servidor:", { serverName, accessCode });
    if (context) {
      alert(
        `Simulando acesso ao servidor: ${serverName} com código: ${accessCode}. Funcionalidade a ser implementada.`
      );
      context.navigateTo(ScreenEnum.HOME);
    }
  };

  return (
    <ScreenWrapper title="ACESSO" maxWidth="xs">
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 }, // p-6
          // No specific border here, Paper has its own elevation/look
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          align="center"
          gutterBottom
          sx={{
            textTransform: "uppercase",
            fontWeight: "medium",
            color: "text.primary",
          }}
        >
          SERVIDOR
        </Typography>
        <StyledInput
          label="Nome"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="Nome do Servidor"
          required
          autoFocus
        />
        <StyledInput
          label="Acesso"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Código de Acesso"
          required
        />
        <Box sx={{ mt: 3 }}>
          <StyledButton type="submit" props_variant="primary">
            OK
          </StyledButton>
        </Box>
      </Paper>
    </ScreenWrapper>
  );
};

export default AccessScreen;
