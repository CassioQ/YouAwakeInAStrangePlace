import React, { useContext } from "react";
import { ScreenEnum, UserRole } from "../models/enums/CommomEnuns";
import { AppContext } from "../contexts/AppContexts";
import MushroomIcon from "../components/icons/MushroomIcon";
import StyledButton from "../components/StyledButton";

const HomeScreen: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return null;
  const {
    setUserRole,
    navigateTo,
    resetCharacterInProgress,
    setCreatedCharacter,
  } = context;

  const handleRoleSelection = (role: UserRole) => {
    setUserRole(role);
    resetCharacterInProgress(); // Reset any previous character creation attempt
    setCreatedCharacter(null); // Clear any previously viewed character
    if (role === UserRole.PLAYER) {
      navigateTo(ScreenEnum.CHARACTER_CREATE_THEME);
    } else {
      navigateTo(ScreenEnum.ACCESS_SERVER);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
      <MushroomIcon className="w-32 h-32 md:w-40 md:h-40 mb-10 text-red-500" />

      <div className="w-full max-w-xs space-y-4">
        <StyledButton
          onClick={() => handleRoleSelection(UserRole.PLAYER)}
          aria-label="Selecionar papel de Jogador e iniciar criação de personagem"
        >
          Jogador
        </StyledButton>
        <StyledButton
          onClick={() => handleRoleSelection(UserRole.GM)}
          variant="outlined"
          aria-label="Selecionar papel de Mestre e acessar servidor"
        >
          Mestre
        </StyledButton>
      </div>

      <p className="mt-12 text-sm text-stone-500">Nos pague uma cerveja</p>
    </div>
  );
};

export default HomeScreen;
