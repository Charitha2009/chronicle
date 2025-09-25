-- Fix room ID to allow custom 6-character codes instead of UUIDs (Version 2)

-- Drop existing tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.choices CASCADE;
DROP TABLE IF EXISTS public.scenes CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;

-- Drop the view
DROP VIEW IF EXISTS public.scenes_view CASCADE;

-- Recreate rooms table with TEXT id instead of UUID
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY, -- Now allows custom 6-character codes
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate players table with TEXT room_id
CREATE TABLE public.players (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Recreate scenes table with TEXT room_id
CREATE TABLE public.scenes (
  id SERIAL PRIMARY KEY,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  turn_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, turn_number)
);

-- Recreate choices table
CREATE TABLE public.choices (
  id SERIAL PRIMARY KEY,
  scene_id INTEGER REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  choice_letter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate votes table
CREATE TABLE public.votes (
  id SERIAL PRIMARY KEY,
  scene_id INTEGER REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
  player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scene_id, player_id)
);

-- Recreate the view
CREATE OR REPLACE VIEW public.scenes_view AS
SELECT
  s.*,
  r.name AS room_name
FROM public.scenes s
JOIN public.rooms r ON s.room_id = r.id
WHERE s.id = (
  SELECT id
  FROM public.scenes
  WHERE room_id = s.room_id
  ORDER BY turn_number DESC
  LIMIT 1
);

-- Re-enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can view rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view players" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert players" ON public.players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update players" ON public.players
  FOR UPDATE USING (true);

CREATE POLICY "Players in room can view scenes" ON public.scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players AS p
      WHERE p.room_id = scenes.room_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert scenes" ON public.scenes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Players in room can view choices" ON public.choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players AS p
      JOIN public.scenes AS s ON p.room_id = s.room_id
      WHERE s.id = choices.scene_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert choices" ON public.choices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own votes" ON public.votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own votes" ON public.votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (user_id = auth.uid());

-- Re-enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.choices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
