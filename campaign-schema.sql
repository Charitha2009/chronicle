-- Campaign System Schema
-- Drop existing tables and create new campaign-based structure

-- Drop existing tables in correct order
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.choices CASCADE;
DROP TABLE IF EXISTS public.scenes CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP VIEW IF EXISTS public.scenes_view CASCADE;

-- Create campaigns table (replaces rooms)
CREATE TABLE public.campaigns (
  id TEXT PRIMARY KEY, -- 6-character campaign code
  title TEXT NOT NULL,
  genre TEXT NOT NULL CHECK (genre IN ('dark_fantasy', 'space_opera', 'mystery', 'post_apoc', 'pirate', 'fantasy', 'scifi', 'horror', 'adventure', 'romance')),
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'character_select', 'starting', 'active', 'ended')),
  max_players INTEGER,
  host_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create characters table
CREATE TABLE public.characters (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID, -- NULL for guest players
  name TEXT NOT NULL,
  archetype TEXT NOT NULL,
  avatar_url TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, name)
);

-- Create turns table
CREATE TABLE public.turns (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  turn_index INTEGER NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, turn_index)
);

-- Create resolutions table (for Turn 1 opening scene)
CREATE TABLE public.resolutions (
  id SERIAL PRIMARY KEY,
  turn_id INTEGER REFERENCES public.turns(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
  memory_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create world_state table
CREATE TABLE public.world_state (
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE PRIMARY KEY,
  facts JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create actions table (for Turn 1+ actions)
CREATE TABLE public.actions (
  id SERIAL PRIMARY KEY,
  turn_id INTEGER REFERENCES public.turns(id) ON DELETE CASCADE NOT NULL,
  character_id INTEGER REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table (for hook voting)
CREATE TABLE public.votes (
  id SERIAL PRIMARY KEY,
  turn_id INTEGER REFERENCES public.turns(id) ON DELETE CASCADE NOT NULL,
  character_id INTEGER REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  hook_index INTEGER NOT NULL, -- 0, 1, or 2 for hooks A, B, C
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(turn_id, character_id)
);

-- Create indexes
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_characters_campaign_locked ON public.characters(campaign_id, is_locked);
CREATE INDEX idx_turns_campaign_index ON public.turns(campaign_id, turn_index);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Campaigns: visible to anyone, writable by host
CREATE POLICY "Campaigns are visible to all" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Host can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Host can update campaigns" ON public.campaigns
  FOR UPDATE USING (true);

-- Characters: visible to all in campaign, writable by owner until locked
CREATE POLICY "Characters visible to campaign members" ON public.characters
  FOR SELECT USING (true);

CREATE POLICY "Users can create characters" ON public.characters
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Character owners can update unlocked characters" ON public.characters
  FOR UPDATE USING (
    (user_id = auth.uid() OR user_id IS NULL) AND is_locked = false
  );

-- Turns: visible to campaign members, insert by service role
CREATE POLICY "Turns visible to campaign members" ON public.turns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c 
      WHERE c.id = turns.campaign_id
    )
  );

CREATE POLICY "Service role can insert turns" ON public.turns
  FOR INSERT WITH CHECK (true);

-- Resolutions: visible to campaign members, insert by service role
CREATE POLICY "Resolutions visible to campaign members" ON public.resolutions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.turns t
      JOIN public.campaigns c ON t.campaign_id = c.id
      WHERE t.id = resolutions.turn_id
    )
  );

CREATE POLICY "Service role can insert resolutions" ON public.resolutions
  FOR INSERT WITH CHECK (true);

-- World State: visible to campaign members, writable by service role
CREATE POLICY "World state visible to campaign members" ON public.world_state
  FOR SELECT USING (true);

CREATE POLICY "Service role can update world state" ON public.world_state
  FOR ALL USING (true);

-- Actions: visible to campaign members, writable by character owners
CREATE POLICY "Actions visible to campaign members" ON public.actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.turns t
      JOIN public.campaigns c ON t.campaign_id = c.id
      WHERE t.id = actions.turn_id
    )
  );

CREATE POLICY "Character owners can create actions" ON public.actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters ch
      WHERE ch.id = actions.character_id 
      AND (ch.user_id = auth.uid() OR ch.user_id IS NULL)
    )
  );

-- Votes: visible to campaign members, writable by character owners
CREATE POLICY "Votes visible to campaign members" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.turns t
      JOIN public.campaigns c ON t.campaign_id = c.id
      WHERE t.id = votes.turn_id
    )
  );

CREATE POLICY "Character owners can vote" ON public.votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters ch
      WHERE ch.id = votes.character_id 
      AND (ch.user_id = auth.uid() OR ch.user_id IS NULL)
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.turns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resolutions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.world_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
