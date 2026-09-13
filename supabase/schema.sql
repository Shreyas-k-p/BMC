-- =========================================================
-- BMC LIVE: COMPLETE SUPABASE DATABASE SCHEMA & RLS POLICIES
-- =========================================================

-- 0. ENUM TYPE FOR SESSION STATUS
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM (
        'LOBBY',
        'PREPARATION',
        'STUDY',
        'PRESENTATION',
        'SCORING',
        'LEADERBOARD',
        'COMPLETED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    status session_status NOT NULL DEFAULT 'LOBBY',
    host_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    preparation_started_at TIMESTAMPTZ,
    preparation_duration INT DEFAULT 900,
    study_started_at TIMESTAMPTZ,
    study_duration INT DEFAULT 600,
    current_group_id TEXT,
    presentation_started_at TIMESTAMPTZ,
    presentation_duration INT DEFAULT 180,
    scoring_open BOOLEAN DEFAULT FALSE
);

-- 2. PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ONLINE',
    group_id TEXT,
    is_captain BOOLEAN DEFAULT FALSE,
    is_demo BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    id TEXT PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    group_number INT NOT NULL,
    group_name TEXT NOT NULL,
    captain_id TEXT,
    captain_name TEXT,
    product_id TEXT,
    product JSONB,
    members JSONB DEFAULT '[]'::jsonb,
    presentation_order INT,
    final_score NUMERIC(3, 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PEER SCORES TABLE
CREATE TABLE IF NOT EXISTS public.peer_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL,
    evaluator_participant_id TEXT NOT NULL,
    evaluator_team_id TEXT NOT NULL,
    evaluator_team_name TEXT NOT NULL,
    score INT NOT NULL CHECK (score >= 0 AND score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LOBBY MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.lobby_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;

-- SESSIONS POLICIES
DROP POLICY IF EXISTS "Allow public read access to sessions" ON public.sessions;
CREATE POLICY "Allow public read access to sessions"
ON public.sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow host create/update sessions" ON public.sessions;
CREATE POLICY "Allow host create/update sessions"
ON public.sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert sessions" ON public.sessions;
CREATE POLICY "Allow public insert sessions"
ON public.sessions FOR INSERT WITH CHECK (true);

-- PARTICIPANTS POLICIES
DROP POLICY IF EXISTS "Allow public read access to participants" ON public.participants;
CREATE POLICY "Allow public read access to participants"
ON public.participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow student participant join during LOBBY" ON public.participants;
CREATE POLICY "Allow student participant join during LOBBY"
ON public.participants FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.id = session_id
        AND s.status IN ('LOBBY')
    )
);

DROP POLICY IF EXISTS "Allow participant status updates" ON public.participants;
CREATE POLICY "Allow participant status updates"
ON public.participants FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow participant deletion by host" ON public.participants;
CREATE POLICY "Allow participant deletion by host"
ON public.participants FOR DELETE USING (true);

-- GROUPS POLICIES
DROP POLICY IF EXISTS "Allow public read access to groups" ON public.groups;
CREATE POLICY "Allow public read access to groups"
ON public.groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow host management of groups" ON public.groups;
CREATE POLICY "Allow host management of groups"
ON public.groups FOR ALL USING (true);

-- PEER SCORES POLICIES
DROP POLICY IF EXISTS "Allow public read access to peer_scores" ON public.peer_scores;
CREATE POLICY "Allow public read access to peer_scores"
ON public.peer_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow captain score submission during SCORING" ON public.peer_scores;
CREATE POLICY "Allow captain score submission during SCORING"
ON public.peer_scores FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.id = session_id
        AND s.status IN ('PRESENTATION', 'SCORING')
    )
);

-- LOBBY MESSAGES POLICIES
DROP POLICY IF EXISTS "Allow public read access to lobby messages" ON public.lobby_messages;
CREATE POLICY "Allow public read access to lobby messages"
ON public.lobby_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow message insertion only during LOBBY" ON public.lobby_messages;
CREATE POLICY "Allow message insertion only during LOBBY"
ON public.lobby_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.id = session_id
        AND s.status IN ('LOBBY')
    )
);

-- =========================================================
-- ENABLE REALTIME PUBLICATION FOR ALL TABLES
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.peer_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_messages;
