-- Enable realtime for votes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Enable realtime for scenes table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes;

-- Enable realtime for choices table (optional, for future use)
ALTER PUBLICATION supabase_realtime ADD TABLE public.choices;

-- Verify the publications are enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND schemaname = 'public'
AND tablename IN ('votes', 'scenes', 'choices');
