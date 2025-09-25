-- Fix RLS policies to prevent infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view players in rooms they're in" ON public.players;
DROP POLICY IF EXISTS "Users can join rooms as players" ON public.players;
DROP POLICY IF EXISTS "Users can update their own player data" ON public.players;

-- Create simpler, non-recursive policies for players
CREATE POLICY "Anyone can view players" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert players" ON public.players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update players" ON public.players
  FOR UPDATE USING (true);

-- Enable realtime for players table
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
