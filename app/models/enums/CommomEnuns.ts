export enum UserRole {
  PLAYER = "player",
  GM = "gm",
}

export enum ScreenEnum {
  LOGIN = "LOGIN",
  EMAIL_LOGIN = "EMAIL_LOGIN",
  EMAIL_SIGNUP = "EMAIL_SIGNUP",
  HOME = "HOME",
  ACCESS_SERVER = "ACCESS_SERVER", // For GM or Player joining existing game
  CHARACTER_CREATE_THEME = "CHARACTER_CREATE_THEME",
  CHARACTER_CREATE_DETAILS = "CHARACTER_CREATE_DETAILS", // Genre, Adjective, Place
  CHARACTER_CREATE_NAME_DESC_SKILL = "CHARACTER_CREATE_NAME_DESC_SKILL", // Name, Description, Primary Skill
  CHARACTER_SHEET = "CHARACTER_SHEET",
  // Add more screens as needed
}

export enum CharacterCreationStep {
  THEME,
  DETAILS,
  NAME_DESC_SKILL,
}

export enum CharacterSheetTab {
  SKILLS = "Habilidades",
  ITEMS = "Itens",
  OBJECTIVE = "Objetivo",
}
