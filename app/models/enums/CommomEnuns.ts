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
  PLAYER_GAMEPLAY = "PLAYER_GAMEPLAY",
  GM_GAMEPLAY = "GM_GAMEPLAY",
  CHARACTER_SHEET = "CHARACTER_SHEET",
  // Deprecated by new setup flow, but re-added to fix direct errors:
  CHARACTER_CREATE_THEME = "CHARACTER_CREATE_THEME",
  CHARACTER_CREATE_DETAILS = "CHARACTER_CREATE_DETAILS",
  CHARACTER_CREATE_NAME_DESC_SKILL = "CHARACTER_CREATE_NAME_DESC_SKILL",
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
  // GAMEPLAY_ACTIVE = "gameplay_active", // Might be better to use GamePhase
}

export enum GamePhase {
  LOBBY = "lobby", // Existing server status
  SETUP = "setup", // When gameSetup is active
  ACTIVE = "active", // Gameplay is active
  PAUSED = "paused",
  ENDED = "ended",
}

export enum GameLogEntryType {
  ROLL = "roll",
  CHAT = "chat",
  INFO = "info",
  SYSTEM = "system",
  TOKEN = "token",
  GENERIC_ROLL = "generic_roll", // Added for generic 2d6 rolls
}
