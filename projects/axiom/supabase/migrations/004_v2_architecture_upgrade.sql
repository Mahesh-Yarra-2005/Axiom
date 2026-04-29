-- Axiom v2.0 — Architecture Upgrade Migration
-- Knowledge Graph, Event System, FSRS, Gamification, Teacher Tools, Education Levels

-- ============================
-- EDUCATION LEVELS EXPANSION
-- ============================

-- Expand exam_type to support all education levels
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_exam_type_check;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'senior_secondary',
  ADD COLUMN IF NOT EXISTS branch TEXT,
  ADD COLUMN IF NOT EXISTS year_of_study INTEGER,
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'read_write', NULL));

-- Education levels: middle_school, secondary, senior_secondary, undergraduate, postgraduate, research
ALTER TABLE public.students
  ADD CONSTRAINT students_education_level_check
  CHECK (education_level IN ('middle_school', 'secondary', 'senior_secondary', 'undergraduate', 'postgraduate', 'research'));

-- ============================
-- KNOWLEDGE GRAPH
-- ============================

-- Atomic knowledge concepts
CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id BIGSERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT NOT NULL,
  description TEXT,
  education_level TEXT NOT NULL DEFAULT 'senior_secondary',
  difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 10),
  blooms_level TEXT CHECK (blooms_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prerequisite/relationship edges between concepts
CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id BIGSERIAL PRIMARY KEY,
  from_node_id BIGINT NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id BIGINT NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'prerequisite' CHECK (relationship IN ('prerequisite', 'related', 'extends', 'applies_to')),
  strength REAL DEFAULT 1.0 CHECK (strength BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_node_id, to_node_id, relationship)
);

-- Per-student mastery level per knowledge node
CREATE TABLE IF NOT EXISTS public.student_mastery (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  node_id BIGINT NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  mastery_level REAL DEFAULT 0.0 CHECK (mastery_level BETWEEN 0 AND 1),
  confidence REAL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  last_reviewed TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, node_id)
);

-- ============================
-- EVENT-DRIVEN ARCHITECTURE
-- ============================

-- All student learning events for real-time analytics
CREATE TABLE IF NOT EXISTS public.study_events (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'session_start', 'session_end',
    'flashcard_reviewed', 'flashcard_created',
    'quiz_started', 'quiz_completed', 'quiz_question_answered',
    'note_created', 'note_viewed',
    'video_watched', 'video_summarized',
    'chat_message_sent', 'chat_message_received',
    'concept_mastered', 'concept_struggled',
    'goal_set', 'goal_completed',
    'assignment_started', 'assignment_submitted',
    'streak_continued', 'streak_broken',
    'level_up', 'badge_earned'
  )),
  metadata JSONB DEFAULT '{}', -- Flexible payload per event type
  subject TEXT,
  chapter TEXT,
  node_id BIGINT REFERENCES public.knowledge_nodes(id),
  duration_seconds INTEGER,
  score REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- FSRS (Free Spaced Repetition Scheduler)
-- ============================

-- Upgrade flashcards table with FSRS parameters
ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS stability REAL DEFAULT 0.4,
  ADD COLUMN IF NOT EXISTS difficulty REAL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS elapsed_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reps INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lapses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  ADD COLUMN IF NOT EXISTS last_review TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS node_id BIGINT REFERENCES public.knowledge_nodes(id);

-- ============================
-- GAMIFICATION
-- ============================

-- XP and Level tracking
CREATE TABLE IF NOT EXISTS public.student_xp (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges/Achievements
CREATE TABLE IF NOT EXISTS public.badges (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'mastery', 'social', 'milestone', 'special')),
  criteria JSONB NOT NULL, -- { type: 'streak', value: 7 } or { type: 'flashcards_mastered', value: 100 }
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student-Badge junction (earned badges)
CREATE TABLE IF NOT EXISTS public.student_badges (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  badge_id BIGINT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);

-- Daily challenges
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('flashcard', 'quiz', 'study_time', 'concept', 'chat')),
  criteria JSONB NOT NULL, -- { min_cards: 20, subject: 'Physics' }
  xp_reward INTEGER DEFAULT 100,
  education_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student challenge completions
CREATE TABLE IF NOT EXISTS public.student_challenges (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  challenge_id BIGINT NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, challenge_id)
);

-- ============================
-- TEACHER TOOLS
-- ============================

-- Quizzes created by teachers
CREATE TABLE IF NOT EXISTS public.quizzes (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  chapter TEXT,
  education_level TEXT DEFAULT 'senior_secondary',
  time_limit_minutes INTEGER,
  total_marks INTEGER,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  blooms_distribution JSONB DEFAULT '{}', -- { "remember": 2, "understand": 3, "apply": 5 }
  settings JSONB DEFAULT '{}', -- { shuffle: true, show_answers_after: true, attempts: 1 }
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id BIGSERIAL PRIMARY KEY,
  quiz_id BIGINT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'short_answer', 'numerical', 'true_false', 'match')),
  options JSONB, -- for MCQ: [{"id": "a", "text": "...", "is_correct": true}]
  correct_answer TEXT,
  explanation TEXT,
  marks INTEGER DEFAULT 1,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  blooms_level TEXT CHECK (blooms_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  node_id BIGINT REFERENCES public.knowledge_nodes(id),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts by students
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  quiz_id BIGINT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '[]', -- [{ question_id, selected_answer, is_correct, time_spent_seconds }]
  score REAL,
  total_marks REAL,
  percentage REAL,
  time_taken_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Assignments from teachers
CREATE TABLE IF NOT EXISTS public.assignments (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  chapter TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'quiz', 'notes', 'flashcards', 'video', 'project')),
  due_date TIMESTAMPTZ,
  points INTEGER DEFAULT 100,
  attachments JSONB DEFAULT '[]', -- [{ type: 'quiz_id', value: 5 }, { type: 'url', value: '...' }]
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content JSONB DEFAULT '{}', -- Flexible submission data
  score REAL,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned', 'late')),
  UNIQUE(assignment_id, student_id)
);

-- Teacher announcements/messages
CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'reminder', 'urgent', 'resource')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'specific')),
  target_student_ids BIGINT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  read_by BIGINT[] DEFAULT '{}', -- student_ids who have read it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher shared resources/notes
CREATE TABLE IF NOT EXISTS public.shared_resources (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('note', 'link', 'file', 'flashcard_deck', 'video')),
  subject TEXT,
  chapter TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- AI NUDGES & INTERVENTIONS
-- ============================

CREATE TABLE IF NOT EXISTS public.ai_nudges (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL CHECK (nudge_type IN (
    'inactivity', 'streak_at_risk', 'struggle_detected',
    'milestone_near', 'review_due', 'encouragement',
    'study_suggestion', 'break_reminder'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- COLLABORATIVE FEATURES
-- ============================

-- Study groups
CREATE TABLE IF NOT EXISTS public.study_groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  created_by BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invite_code VARCHAR(8) UNIQUE,
  max_members INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study group members
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- Discussion threads (per group or per class)
CREATE TABLE IF NOT EXISTS public.discussions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES public.study_groups(id) ON DELETE CASCADE,
  subject TEXT,
  chapter TEXT,
  node_id BIGINT REFERENCES public.knowledge_nodes(id),
  upvotes INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion replies
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id BIGSERIAL PRIMARY KEY,
  discussion_id BIGINT NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_accepted_answer BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- INDEXES
-- ============================

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_subject ON public.knowledge_nodes(subject);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_level ON public.knowledge_nodes(education_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_from ON public.knowledge_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_to ON public.knowledge_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_student ON public.student_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_node ON public.student_mastery(node_id);
CREATE INDEX IF NOT EXISTS idx_study_events_student ON public.study_events(student_id);
CREATE INDEX IF NOT EXISTS idx_study_events_type ON public.study_events(event_type);
CREATE INDEX IF NOT EXISTS idx_study_events_created ON public.study_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_events_student_time ON public.study_events(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON public.quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher ON public.announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_nudges_student ON public.ai_nudges(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_nudges_unread ON public.ai_nudges(student_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_student_xp_level ON public.student_xp(level DESC);
CREATE INDEX IF NOT EXISTS idx_study_groups_code ON public.study_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_discussions_group ON public.discussions(group_id);

-- ============================
-- RLS POLICIES
-- ============================

ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

-- Knowledge graph: readable by all authenticated
CREATE POLICY "Anyone read knowledge nodes" ON public.knowledge_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone read knowledge edges" ON public.knowledge_edges FOR SELECT TO authenticated USING (true);

-- Student mastery: own data + teachers can read linked students
CREATE POLICY "Students manage own mastery" ON public.student_mastery FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Teachers read linked student mastery" ON public.student_mastery FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT tsl.student_id FROM public.teacher_student_links tsl
    JOIN public.teachers t ON tsl.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  ));

-- Study events: own data + teachers can read
CREATE POLICY "Students manage own events" ON public.study_events FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Teachers read linked student events" ON public.study_events FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT tsl.student_id FROM public.teacher_student_links tsl
    JOIN public.teachers t ON tsl.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  ));

-- XP & Badges: readable by all (leaderboards)
CREATE POLICY "Students manage own XP" ON public.student_xp FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Anyone read XP" ON public.student_xp FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone read badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students manage own badges" ON public.student_badges FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Anyone read student badges" ON public.student_badges FOR SELECT TO authenticated USING (true);

-- Challenges
CREATE POLICY "Anyone read challenges" ON public.daily_challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students manage own challenge completions" ON public.student_challenges FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Quizzes: teachers create, linked students take
CREATE POLICY "Teachers manage own quizzes" ON public.quizzes FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Students read assigned quizzes" ON public.quizzes FOR SELECT TO authenticated
  USING (status = 'published' AND teacher_id IN (
    SELECT tsl.teacher_id FROM public.teacher_student_links tsl
    JOIN public.students s ON tsl.student_id = s.id
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Teachers manage own quiz questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (quiz_id IN (SELECT id FROM public.quizzes WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())));
CREATE POLICY "Students read quiz questions" ON public.quiz_questions FOR SELECT TO authenticated
  USING (quiz_id IN (
    SELECT q.id FROM public.quizzes q
    WHERE q.status = 'published' AND q.teacher_id IN (
      SELECT tsl.teacher_id FROM public.teacher_student_links tsl
      JOIN public.students s ON tsl.student_id = s.id
      WHERE s.user_id = auth.uid()
    )
  ));

-- Quiz attempts: students own, teachers read
CREATE POLICY "Students manage own attempts" ON public.quiz_attempts FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Teachers read linked student attempts" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT tsl.student_id FROM public.teacher_student_links tsl
    JOIN public.teachers t ON tsl.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  ));

-- Assignments: teachers create, students submit
CREATE POLICY "Teachers manage own assignments" ON public.assignments FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Students read assigned assignments" ON public.assignments FOR SELECT TO authenticated
  USING (status = 'active' AND teacher_id IN (
    SELECT tsl.teacher_id FROM public.teacher_student_links tsl
    JOIN public.students s ON tsl.student_id = s.id
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Students manage own submissions" ON public.assignment_submissions FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Teachers read linked submissions" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT tsl.student_id FROM public.teacher_student_links tsl
    JOIN public.teachers t ON tsl.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  ));
CREATE POLICY "Teachers update submissions (grading)" ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())));

-- Announcements: teachers create, linked students read
CREATE POLICY "Teachers manage own announcements" ON public.announcements FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Students read teacher announcements" ON public.announcements FOR SELECT TO authenticated
  USING (teacher_id IN (
    SELECT tsl.teacher_id FROM public.teacher_student_links tsl
    JOIN public.students s ON tsl.student_id = s.id
    WHERE s.user_id = auth.uid()
  ));

-- Shared resources: teachers create, linked students read
CREATE POLICY "Teachers manage own resources" ON public.shared_resources FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Students read teacher resources" ON public.shared_resources FOR SELECT TO authenticated
  USING (teacher_id IN (
    SELECT tsl.teacher_id FROM public.teacher_student_links tsl
    JOIN public.students s ON tsl.student_id = s.id
    WHERE s.user_id = auth.uid()
  ));

-- AI Nudges: students own
CREATE POLICY "Students manage own nudges" ON public.ai_nudges FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Study groups & discussions: members access
CREATE POLICY "Anyone read groups" ON public.study_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students create groups" ON public.study_groups FOR INSERT TO authenticated
  WITH CHECK (created_by IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Members read group members" ON public.study_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students join groups" ON public.study_group_members FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Anyone read discussions" ON public.discussions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students create discussions" ON public.discussions FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Anyone read replies" ON public.discussion_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students create replies" ON public.discussion_replies FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Teachers can also read daily_progress and flashcards of linked students
CREATE POLICY "Teachers read linked student progress" ON public.daily_progress FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT tsl.student_id FROM public.teacher_student_links tsl
    JOIN public.teachers t ON tsl.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  ));

CREATE POLICY "Teachers read linked student flashcards" ON public.flashcards FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT tsl.student_id FROM public.teacher_student_links tsl
    JOIN public.teachers t ON tsl.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  ));

CREATE POLICY "Teachers read linked student notes" ON public.notes FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT tsl.student_id FROM public.teacher_student_links tsl
    JOIN public.teachers t ON tsl.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  ));

-- ============================
-- SEED DEFAULT BADGES
-- ============================

INSERT INTO public.badges (name, description, icon, category, criteria, xp_reward) VALUES
  ('First Steps', 'Complete your first study session', 'footsteps', 'milestone', '{"type": "sessions", "value": 1}', 25),
  ('Week Warrior', 'Study for 7 consecutive days', 'flame', 'streak', '{"type": "streak", "value": 7}', 100),
  ('Month Master', 'Study for 30 consecutive days', 'trophy', 'streak', '{"type": "streak", "value": 30}', 500),
  ('Flash Scholar', 'Master 50 flashcards', 'flash', 'mastery', '{"type": "flashcards_mastered", "value": 50}', 150),
  ('Century Club', 'Master 100 flashcards', 'medal', 'mastery', '{"type": "flashcards_mastered", "value": 100}', 300),
  ('Knowledge Keeper', 'Create 25 notes', 'book', 'milestone', '{"type": "notes_created", "value": 25}', 100),
  ('Quiz Champion', 'Score 90%+ on 10 quizzes', 'ribbon', 'mastery', '{"type": "quiz_high_scores", "value": 10}', 200),
  ('Early Bird', 'Study before 7 AM for 5 days', 'sunny', 'special', '{"type": "early_study", "value": 5}', 75),
  ('Night Owl', 'Study after 10 PM for 5 days', 'moon', 'special', '{"type": "late_study", "value": 5}', 75),
  ('Team Player', 'Help answer 10 discussion questions', 'people', 'social', '{"type": "discussions_answered", "value": 10}', 150),
  ('Concept Conqueror', 'Master all nodes in a chapter', 'star', 'mastery', '{"type": "chapter_mastered", "value": 1}', 250),
  ('Marathon Learner', 'Study for 100 total hours', 'time', 'milestone', '{"type": "total_hours", "value": 100}', 500)
ON CONFLICT (name) DO NOTHING;

-- ============================
-- TRIGGERS
-- ============================

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_student_mastery_updated_at BEFORE UPDATE ON public.student_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_student_xp_updated_at BEFORE UPDATE ON public.student_xp FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate study group invite code
CREATE TRIGGER set_study_group_invite_code
  BEFORE INSERT ON public.study_groups
  FOR EACH ROW
  WHEN (NEW.invite_code IS NULL)
  EXECUTE FUNCTION generate_teacher_code();
