-- Cleanup Database - Drop all tables in correct order
-- Run this in your Supabase SQL Editor to clear existing tables

-- Drop the view first
DROP VIEW IF EXISTS public.scenes_view;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.choices CASCADE;
DROP TABLE IF EXISTS public.scenes CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;

-- Drop any remaining policies
DROP POLICY IF EXISTS "Users can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view players in rooms they're in" ON public.players;
DROP POLICY IF EXISTS "Users can join rooms as players" ON public.players;
DROP POLICY IF EXISTS "Users can update their own player data" ON public.players;
DROP POLICY IF EXISTS "Users can view scenes in rooms they're in" ON public.scenes;
DROP POLICY IF EXISTS "Service role can create scenes" ON public.scenes;
DROP POLICY IF EXISTS "Users can view choices for scenes in rooms they're in" ON public.choices;
DROP POLICY IF EXISTS "Service role can create choices" ON public.choices;
DROP POLICY IF EXISTS "Users can view their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can create/update their own votes" ON public.votes;

-- Remove realtime publications (these may fail if tables aren't in publication)
-- We'll handle errors gracefully by using DO blocks
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.votes;
    EXCEPTION 
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.scenes;
    EXCEPTION 
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.choices;
    EXCEPTION 
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Verify cleanup
SELECT 'Cleanup complete' as status;
