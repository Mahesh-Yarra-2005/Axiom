-- Axiom Study Assistant — Initial Schema
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'teacher')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students profile
CREATE TABLE IF NOT EXISTS public.students (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  exam_type TEXT, -- 'JEE', 'NEET', 'CBSE_12', 'CBSE_10', 'CUSTOM'
  target_date DATE,
  syllabus_text TEXT,
  grade_level TEXT,
  invite_code VARCHAR(6) UNIQUE, -- for parent linking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents profile
CREATE TABLE IF NOT EXISTS public.parents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-Student linking
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Study Plans
CREATE TABLE IF NOT EXISTS public.study_plans (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  milestones JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Goals
CREATE TABLE IF NOT EXISTS public.study_goals (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  target_date DATE,
  target_score TEXT,
  progress_pct REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Progress
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  study_minutes INTEGER DEFAULT 0,
  chapters_covered JSONB DEFAULT '[]',
  quiz_score REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  is_hots BOOLEAN DEFAULT FALSE,
  blooms_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_json TEXT,
  subject TEXT,
  chapter TEXT,
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'chat_export', 'video_summary')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Watches
CREATE TABLE IF NOT EXISTS public.video_watches (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  timestamps_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- YouTube Cache (for saving API quota)
CREATE TABLE IF NOT EXISTS public.youtube_cache (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS public.flashcards (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT,
  chapter TEXT,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  ease_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mind Maps
CREATE TABLE IF NOT EXISTS public.mind_maps (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT,
  chapter TEXT,
  title TEXT,
  nodes_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_invite_code ON public.students(invite_code);
CREATE INDEX idx_parents_user_id ON public.parents(user_id);
CREATE INDEX idx_parent_student_links_parent ON public.parent_student_links(parent_id);
CREATE INDEX idx_parent_student_links_student ON public.parent_student_links(student_id);
CREATE INDEX idx_study_plans_student ON public.study_plans(student_id);
CREATE INDEX idx_conversations_student ON public.conversations(student_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_starred ON public.messages(conversation_id) WHERE is_starred = TRUE;
CREATE INDEX idx_notes_student ON public.notes(student_id);
CREATE INDEX idx_notes_subject ON public.notes(student_id, subject);
CREATE INDEX idx_flashcards_student ON public.flashcards(student_id);
CREATE INDEX idx_flashcards_review ON public.flashcards(student_id, next_review);
CREATE INDEX idx_daily_progress_student_date ON public.daily_progress(student_id, date);
CREATE INDEX idx_video_watches_student ON public.video_watches(student_id);
CREATE INDEX idx_youtube_cache_query ON public.youtube_cache(query);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Users: can read/update own profile
CREATE POLICY "Users read own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Students: own data
CREATE POLICY "Students read own" ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students insert own" ON public.students FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students update own" ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid());
-- Parents can read linked students
CREATE POLICY "Parents read linked students" ON public.students FOR SELECT TO authenticated
  USING (id IN (
    SELECT psl.student_id FROM public.parent_student_links psl
    JOIN public.parents p ON psl.parent_id = p.id
    WHERE p.user_id = auth.uid()
  ));
-- Anyone can read a student by invite code (for linking)
CREATE POLICY "Read student by invite code" ON public.students FOR SELECT TO authenticated
  USING (invite_code IS NOT NULL);

-- Parents: own data
CREATE POLICY "Parents read own" ON public.parents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Parents insert own" ON public.parents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Parent-Student Links
CREATE POLICY "Parents read own links" ON public.parent_student_links FOR SELECT TO authenticated
  USING (parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()));
CREATE POLICY "Parents insert links" ON public.parent_student_links FOR INSERT TO authenticated
  WITH CHECK (parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()));

-- Study Plans: student owns, parent can read
CREATE POLICY "Student read own plans" ON public.study_plans FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Student manage own plans" ON public.study_plans FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Parent read child plans" ON public.study_plans FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT psl.student_id FROM public.parent_student_links psl
    JOIN public.parents p ON psl.parent_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Study Goals: same pattern
CREATE POLICY "Student manage own goals" ON public.study_goals FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Parent read child goals" ON public.study_goals FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT psl.student_id FROM public.parent_student_links psl
    JOIN public.parents p ON psl.parent_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Daily Progress: same pattern
CREATE POLICY "Student manage own progress" ON public.daily_progress FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Parent read child progress" ON public.daily_progress FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT psl.student_id FROM public.parent_student_links psl
    JOIN public.parents p ON psl.parent_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Conversations: student owns
CREATE POLICY "Student manage conversations" ON public.conversations FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Messages: access via conversation ownership
CREATE POLICY "Access messages via conversation" ON public.messages FOR ALL TO authenticated
  USING (conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.students s ON c.student_id = s.id
    WHERE s.user_id = auth.uid()
  ));

-- Notes: student owns
CREATE POLICY "Student manage notes" ON public.notes FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Video Watches: student owns, peers can read (for peer picks)
CREATE POLICY "Student manage watches" ON public.video_watches FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "All students read watches" ON public.video_watches FOR SELECT TO authenticated USING (true);

-- YouTube Cache: anyone can read, system inserts
CREATE POLICY "Anyone read cache" ON public.youtube_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone insert cache" ON public.youtube_cache FOR INSERT TO authenticated WITH CHECK (true);

-- Flashcards: student owns
CREATE POLICY "Student manage flashcards" ON public.flashcards FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Mind Maps: student owns
CREATE POLICY "Student manage mind maps" ON public.mind_maps FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invite_code := upper(substr(md5(random()::text), 1, 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invite_code
  BEFORE INSERT ON public.students
  FOR EACH ROW
  WHEN (NEW.invite_code IS NULL)
  EXECUTE FUNCTION generate_invite_code();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON public.study_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_study_goals_updated_at BEFORE UPDATE ON public.study_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_mind_maps_updated_at BEFORE UPDATE ON public.mind_maps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
