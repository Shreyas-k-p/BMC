-- =========================================================
-- BMC LIVE: SUPABASE SCHEMA & RLS POLICIES FOR LOBBY MESSAGES
-- =========================================================

-- Create lobby_messages table
CREATE TABLE IF NOT EXISTS public.lobby_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;

-- 1. READ Policy: Allow reading messages for any active session
CREATE POLICY "Allow public read access to lobby messages" 
ON public.lobby_messages 
FOR SELECT 
USING (true);

-- 2. INSERT Policy: Allow inserting messages ONLY while session state is LOBBY or JOINING
CREATE POLICY "Allow message insertion only during LOBBY/JOINING stage" 
ON public.lobby_messages 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.id = session_id
        AND s.status IN ('LOBBY', 'JOINING')
    )
);

-- Enable Supabase Realtime publication for lobby_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_messages;
