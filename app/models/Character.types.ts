export interface Skill {
  id: string;
  name: string;
  modifier: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  playerName?: string;
  description: string;
  avatarUrl?: string;
  themeImageURL?: string; // For the image on top of ficha (cyberpunk example)
  theme?: string; // Thematic input
  genre?: string; // From FICHA creation
  adjective?: string; // From FICHA creation
  location?: string; // From FICHA creation
  primarySkillName?: string; // From FICHA creation (Habilidade)
  skills: Skill[];
  items: Item[];
  objective: string;
}
