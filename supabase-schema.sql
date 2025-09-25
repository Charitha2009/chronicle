-- Chronicle Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Create scenes table
CREATE TABLE IF NOT EXISTS public.scenes (
  id SERIAL PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  turn_number INTEGER NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, turn_number)
);

-- Create choices table
CREATE TABLE IF NOT EXISTS public.choices (
  id SERIAL PRIMARY KEY,
  scene_id INTEGER REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  choice_letter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id SERIAL PRIMARY KEY,
  scene_id INTEGER REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
  player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  choice_id INTEGER REFERENCES public.choices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scene_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Users can view rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (true);

-- RLS Policies for players
CREATE POLICY "Users can view players in rooms they're in" ON public.players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = players.room_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms as players" ON public.players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player data" ON public.players
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for scenes
CREATE POLICY "Users can view scenes in rooms they're in" ON public.scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = scenes.room_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can create scenes" ON public.scenes
  FOR INSERT WITH CHECK (true);

-- RLS Policies for choices
CREATE POLICY "Users can view choices for scenes in rooms they're in" ON public.choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scenes s
      JOIN public.players p ON p.room_id = s.room_id
      WHERE s.id = choices.scene_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can create choices" ON public.choices
  FOR INSERT WITH CHECK (true);

-- RLS Policies for votes
CREATE POLICY "Users can view their own votes" ON public.votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create/update their own votes" ON public.votes
  FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.choices;

-- Create a view for the latest scene per room (used by the API)
CREATE OR REPLACE VIEW public.scenes_view AS
SELECT 
  s.*,
  r.name as room_name
FROM public.scenes s
JOIN public.rooms r ON r.id = s.room_id
WHERE s.turn_number = (
  SELECT MAX(turn_number) 
  FROM public.scenes s2 
  WHERE s2.room_id = s.room_id
);

-- Grant access to the view
GRANT SELECT ON public.scenes_view TO authenticated;
GRANT SELECT ON public.scenes_view TO anon;
