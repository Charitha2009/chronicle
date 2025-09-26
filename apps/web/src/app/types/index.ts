// Campaign Types
export type CampaignStatus = 'lobby' | 'character_select' | 'starting' | 'active' | 'ended';
export type Genre = 'dark_fantasy' | 'space_opera' | 'mystery' | 'post_apoc' | 'pirate' | 'fantasy' | 'scifi' | 'horror' | 'adventure' | 'romance';

export interface Campaign {
  id: string;
  title: string;
  genre: Genre;
  status: CampaignStatus;
  max_players: number;
  host_user_id: string;
  created_at: string;
  updated_at: string;
}

// Character Types
export interface Character {
  id: number;
  campaign_id: string;
  user_id: string;
  name: string;
  archetype: string;
  avatar_url: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

// Turn Types
export interface Turn {
  id: number;
  campaign_id: string;
  turn_index: number;
  starts_at: string;
  ends_at: string;
  summary: string;
  created_at: string;
}

export interface Resolution {
  id: number;
  turn_id: number;
  content: string;
  hooks: string[];
  memory_summary: string;
  created_at: string;
}

// Vote Types
export interface Vote {
  id: number;
  turn_id: number;
  character_id: number;
  hook_index: number;
  created_at: string;
  characters?: {
    name: string;
    archetype: string;
  };
}

// Legacy Types (for backward compatibility)
export interface Player {
  id: number;
  user_id: string;
  room_id: string;
  display_name: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  created_at: string;
}

// Story Genre Types
export interface StoryGenre {
  id: Genre;
  title: string;
  description: string;
  image: string;
  color: string;
}
