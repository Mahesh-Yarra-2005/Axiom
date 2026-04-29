/**
 * Teacher Store — Zustand store for teacher analytics, quizzes, assignments
 */
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface StudentAnalytics {
  id: string;
  name: string;
  initials: string;
  examType: string | null;
  educationLevel: string;
  lastActive: string;
  studyHoursThisWeek: number;
  studyHoursLastWeek: number;
  totalStudyHours: number;
  streakDays: number;
  flashcardsMastered: number;
  flashcardsTotal: number;
  averageQuizScore: number;
  quizzesTaken: number;
  notesCount: number;
  riskLevel: 'low' | 'medium' | 'high'; // At-risk detection
  weakTopics: string[];
  strongTopics: string[];
  trend: 'improving' | 'stable' | 'declining';
  xpLevel: number;
  totalXp: number;
}

interface ClassAnalytics {
  totalStudents: number;
  averageStudyHours: number;
  activeToday: number;
  atRiskCount: number;
  topPerformers: string[];
  subjectBreakdown: { subject: string; averageMastery: number }[];
  weeklyEngagement: { day: string; activeStudents: number; totalMinutes: number }[];
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  questionCount: number;
  timeLimit?: number;
  totalMarks: number;
  status: 'draft' | 'published' | 'archived';
  attemptCount: number;
  averageScore: number;
  createdAt: string;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  type: string;
  dueDate?: string;
  points: number;
  status: string;
  submissionCount: number;
  totalStudents: number;
  averageScore: number;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isPinned: boolean;
  readCount: number;
  totalStudents: number;
  createdAt: string;
}

interface TeacherState {
  teacherId: number | null;
  teacherCode: string | null;
  students: StudentAnalytics[];
  classAnalytics: ClassAnalytics | null;
  quizzes: Quiz[];
  assignments: Assignment[];
  announcements: Announcement[];
  recentEvents: any[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTeacherData: (userId: string) => Promise<void>;
  fetchStudentAnalytics: () => Promise<void>;
  fetchClassAnalytics: () => Promise<void>;
  createQuiz: (quiz: Partial<Quiz> & { questions: any[] }) => Promise<string | null>;
  publishQuiz: (quizId: string) => Promise<void>;
  createAssignment: (assignment: any) => Promise<string | null>;
  createAnnouncement: (announcement: any) => Promise<void>;
  getStudentDetail: (studentId: string) => Promise<StudentAnalytics | null>;
  detectAtRiskStudents: () => StudentAnalytics[];
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  teacherId: null,
  teacherCode: null,
  students: [],
  classAnalytics: null,
  quizzes: [],
  assignments: [],
  announcements: [],
  recentEvents: [],
  loading: false,
  error: null,

  fetchTeacherData: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      // Ensure teacher record exists
      let { data: teacher } = await supabase
        .from('teachers')
        .select('id, teacher_code, school_name, subject')
        .eq('user_id', userId)
        .single();

      if (!teacher) {
        const { data: newTeacher } = await supabase
          .from('teachers')
          .insert({ user_id: userId })
          .select('id, teacher_code, school_name, subject')
          .single();
        teacher = newTeacher;
      }

      if (!teacher) {
        set({ loading: false, error: 'Failed to load teacher data' });
        return;
      }

      set({ teacherId: teacher.id, teacherCode: teacher.teacher_code });

      // Fetch all data in parallel
      await Promise.all([
        get().fetchStudentAnalytics(),
        get().fetchClassAnalytics(),
      ]);

      // Fetch quizzes
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*, quiz_questions(count), quiz_attempts(count)')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false });

      // Fetch assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*, assignment_submissions(count)')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false });

      // Fetch announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false })
        .limit(20);

      set({
        quizzes: (quizzes || []).map((q: any) => ({
          id: String(q.id),
          title: q.title,
          subject: q.subject,
          chapter: q.chapter,
          questionCount: q.quiz_questions?.[0]?.count || 0,
          timeLimit: q.time_limit_minutes,
          totalMarks: q.total_marks || 0,
          status: q.status,
          attemptCount: q.quiz_attempts?.[0]?.count || 0,
          averageScore: 0,
          createdAt: q.created_at,
        })),
        assignments: (assignments || []).map((a: any) => ({
          id: String(a.id),
          title: a.title,
          subject: a.subject,
          type: a.type,
          dueDate: a.due_date,
          points: a.points,
          status: a.status,
          submissionCount: a.assignment_submissions?.[0]?.count || 0,
          totalStudents: get().students.length,
          averageScore: 0,
          createdAt: a.created_at,
        })),
        announcements: (announcements || []).map((a: any) => ({
          id: String(a.id),
          title: a.title,
          content: a.content,
          type: a.type,
          isPinned: a.is_pinned,
          readCount: (a.read_by || []).length,
          totalStudents: get().students.length,
          createdAt: a.created_at,
        })),
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  fetchStudentAnalytics: async () => {
    const teacherId = get().teacherId;
    if (!teacherId) return;

    const { data: links } = await supabase
      .from('teacher_student_links')
      .select(`
        student_id,
        students (
          id, exam_type, education_level,
          users ( full_name, email )
        )
      `)
      .eq('teacher_id', teacherId);

    if (!links || links.length === 0) {
      set({ students: [] });
      return;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const enriched: StudentAnalytics[] = await Promise.all(
      links.map(async (link: any) => {
        const student = link.students;
        const userInfo = student?.users;
        const name = userInfo?.full_name || userInfo?.email?.split('@')[0] || 'Student';
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

        // Get progress data (last 14 days for trend analysis)
        const { data: progress } = await supabase
          .from('daily_progress')
          .select('study_minutes, date, quiz_score')
          .eq('student_id', student.id)
          .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });

        // Get XP data
        const { data: xpData } = await supabase
          .from('student_xp')
          .select('total_xp, level, current_streak')
          .eq('student_id', student.id)
          .single();

        // Get flashcard stats
        const { data: flashcards } = await supabase
          .from('flashcards')
          .select('id, state, stability')
          .eq('student_id', student.id);

        // Get notes count
        const { data: notes } = await supabase
          .from('notes')
          .select('id')
          .eq('student_id', student.id);

        // Calculate metrics
        const thisWeekProgress = (progress || []).filter(
          (p: any) => new Date(p.date) >= sevenDaysAgo
        );
        const lastWeekProgress = (progress || []).filter(
          (p: any) => new Date(p.date) >= fourteenDaysAgo && new Date(p.date) < sevenDaysAgo
        );

        const studyHoursThisWeek = thisWeekProgress.reduce(
          (sum: number, p: any) => sum + (p.study_minutes || 0), 0
        ) / 60;
        const studyHoursLastWeek = lastWeekProgress.reduce(
          (sum: number, p: any) => sum + (p.study_minutes || 0), 0
        ) / 60;

        // Trend detection
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (studyHoursThisWeek > studyHoursLastWeek * 1.2) trend = 'improving';
        else if (studyHoursThisWeek < studyHoursLastWeek * 0.6) trend = 'declining';

        // At-risk detection
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        const daysInactive = progress?.length
          ? Math.floor((Date.now() - new Date(progress[0].date).getTime()) / 86400000)
          : 999;

        if (daysInactive >= 5 || (studyHoursThisWeek < 2 && trend === 'declining')) {
          riskLevel = 'high';
        } else if (daysInactive >= 3 || studyHoursThisWeek < 4) {
          riskLevel = 'medium';
        }

        // Last active
        let lastActive = 'No data';
        if (progress?.length) {
          const diff = Math.floor((Date.now() - new Date(progress[0].date).getTime()) / 86400000);
          lastActive = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff}d ago`;
        }

        // Flashcard analytics
        const flashcardsMastered = (flashcards || []).filter(
          (f: any) => f.state === 'review' && f.stability >= 21
        ).length;

        // Quiz scores
        const quizScores = (thisWeekProgress || [])
          .filter((p: any) => p.quiz_score != null)
          .map((p: any) => p.quiz_score);
        const averageQuizScore = quizScores.length > 0
          ? quizScores.reduce((a: number, b: number) => a + b, 0) / quizScores.length
          : 0;

        return {
          id: String(student.id),
          name,
          initials,
          examType: student.exam_type,
          educationLevel: student.education_level || 'senior_secondary',
          lastActive,
          studyHoursThisWeek: Math.round(studyHoursThisWeek * 10) / 10,
          studyHoursLastWeek: Math.round(studyHoursLastWeek * 10) / 10,
          totalStudyHours: Math.round(((progress || []).reduce((s: number, p: any) => s + (p.study_minutes || 0), 0) / 60) * 10) / 10,
          streakDays: xpData?.current_streak || 0,
          flashcardsMastered,
          flashcardsTotal: (flashcards || []).length,
          averageQuizScore: Math.round(averageQuizScore),
          quizzesTaken: quizScores.length,
          notesCount: (notes || []).length,
          riskLevel,
          weakTopics: [], // TODO: Calculate from mastery data
          strongTopics: [],
          trend,
          xpLevel: xpData?.level || 1,
          totalXp: xpData?.total_xp || 0,
        };
      })
    );

    set({ students: enriched });
  },

  fetchClassAnalytics: async () => {
    const students = get().students;
    if (students.length === 0) {
      set({ classAnalytics: null });
      return;
    }

    const totalStudents = students.length;
    const averageStudyHours = students.reduce((s, st) => s + st.studyHoursThisWeek, 0) / totalStudents;
    const activeToday = students.filter(s => s.lastActive === 'Today').length;
    const atRiskCount = students.filter(s => s.riskLevel === 'high').length;
    const topPerformers = students
      .sort((a, b) => b.studyHoursThisWeek - a.studyHoursThisWeek)
      .slice(0, 3)
      .map(s => s.name);

    set({
      classAnalytics: {
        totalStudents,
        averageStudyHours: Math.round(averageStudyHours * 10) / 10,
        activeToday,
        atRiskCount,
        topPerformers,
        subjectBreakdown: [],
        weeklyEngagement: [],
      },
    });
  },

  createQuiz: async (quizData) => {
    const teacherId = get().teacherId;
    if (!teacherId) return null;

    const { questions, ...quizMeta } = quizData;

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        teacher_id: teacherId,
        title: quizMeta.title,
        subject: quizMeta.subject,
        chapter: quizMeta.chapter,
        time_limit_minutes: quizMeta.timeLimit,
        total_marks: questions?.reduce((s: number, q: any) => s + (q.marks || 1), 0) || 0,
        is_ai_generated: quizMeta.is_ai_generated || false,
        status: 'draft',
      })
      .select()
      .single();

    if (error || !quiz) return null;

    // Insert questions
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q: any, i: number) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type || 'mcq',
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        marks: q.marks || 1,
        difficulty: q.difficulty || 3,
        blooms_level: q.blooms_level,
        order_index: i,
      }));

      await supabase.from('quiz_questions').insert(questionsToInsert);
    }

    return String(quiz.id);
  },

  publishQuiz: async (quizId: string) => {
    await supabase
      .from('quizzes')
      .update({ status: 'published' })
      .eq('id', quizId);

    set({
      quizzes: get().quizzes.map(q =>
        q.id === quizId ? { ...q, status: 'published' as const } : q
      ),
    });
  },

  createAssignment: async (assignmentData) => {
    const teacherId = get().teacherId;
    if (!teacherId) return null;

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        teacher_id: teacherId,
        ...assignmentData,
      })
      .select()
      .single();

    if (error || !data) return null;
    return String(data.id);
  },

  createAnnouncement: async (announcementData) => {
    const teacherId = get().teacherId;
    if (!teacherId) return;

    await supabase.from('announcements').insert({
      teacher_id: teacherId,
      ...announcementData,
    });
  },

  getStudentDetail: async (studentId: string) => {
    return get().students.find(s => s.id === studentId) || null;
  },

  detectAtRiskStudents: () => {
    return get().students.filter(s => s.riskLevel === 'high');
  },
}));
