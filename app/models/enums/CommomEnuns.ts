export enum UserRole {
  PLAYER = "player",
  GM = "gm",
}

export enum ScreenEnum {
  LOGIN = "LOGIN",
  EMAIL_LOGIN = "EMAIL_LOGIN",
  EMAIL_SIGNUP = "EMAIL_SIGNUP",
  HOME = "HOME",
  ACCESS_SERVER = "ACCESS_SERVER",
  CREATE_SERVER = "CREATE_SERVER",
  GM_LOBBY = "GM_LOBBY",
  PLAYER_LOBBY = "PLAYER_LOBBY",
  GAME_SETUP_PLAYER = "GAME_SETUP_PLAYER",
  GAME_SETUP_GM_MONITOR = "GAME_SETUP_GM_MONITOR",
  GAME_IN_PROGRESS_PLAYER = "GAME_IN_PROGRESS_PLAYER",
  GAME_IN_PROGRESS_GM = "GAME_IN_PROGRESS_GM",
  CHARACTER_CREATE_DETAILS = "CHARACTER_CREATE_DETAILS", // deprecated by new flow
  CHARACTER_CREATE_NAME_DESC_SKILL = "CHARACTER_CREATE_NAME_DESC_SKILL", // deprecated by new flow
  CHARACTER_SHEET = "CHARACTER_SHEET",
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

export enum GameSetupPhase {
  ROLLING = "rolling",
  DEFINING_GENRE = "defining_genre",
  DEFINING_ADJECTIVE = "defining_adjective",
  DEFINING_LOCATION = "defining_location",
  DEFINING_TRUTHS = "defining_truths",
  DEFINING_CHARACTER_CONCEPTS = "defining_character_concepts",
  SKILL_DICE_ROLL = "skill_dice_roll",
  DEFINING_PLAYER_SKILLS = "defining_player_skills",
  DEFINING_GM_SKILLS = "defining_gm_skills",
  ASSIGNING_SKILL_MODIFIERS = "assigning_skill_modifiers",
  AWAITING_GAME_START = "awaiting_game_start",
}
