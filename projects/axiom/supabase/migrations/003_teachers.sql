-- Teachers profile
CREATE TABLE IF NOT EXISTS public.teachers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_code VARCHAR(8) UNIQUE,
  school_name TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher-Student linking
CREATE TABLE IF NOT EXISTS public.teacher_student_links (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_code ON public.teachers(teacher_code);
CREATE INDEX IF NOT EXISTS idx_teacher_student_links_teacher ON public.teacher_student_links(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_links_student ON public.teacher_student_links(student_id);

-- RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read own" ON public.teachers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers insert own" ON public.teachers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers update own" ON public.teachers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Read teacher by code" ON public.teachers FOR SELECT TO authenticated USING (teacher_code IS NOT NULL);

CREATE POLICY "Teachers read own links" ON public.teacher_student_links FOR SELECT TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers insert links" ON public.teacher_student_links FOR INSERT TO authenticated
  WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Students read own teacher links" ON public.teacher_student_links FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Students insert teacher links" ON public.teacher_student_links FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Auto-generate teacher code on insert
CREATE OR REPLACE FUNCTION generate_teacher_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.teacher_code := upper(substr(md5(random()::text), 1, 6)) || upper(substr(md5(random()::text), 1, 2));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_teacher_code
  BEFORE INSERT ON public.teachers
  FOR EACH ROW
  WHEN (NEW.teacher_code IS NULL)
  EXECUTE FUNCTION generate_teacher_code();
