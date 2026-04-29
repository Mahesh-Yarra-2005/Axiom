import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#4A90D9',
  Chemistry: '#7B68EE',
  Mathematics: '#D4AF37',
  Biology: '#50C878',
  English: '#E87040',
  Other: '#9B9B9B',
};

interface ChildInfo {
  name: string;
  initials: string;
  exam: string;
  studyHours: number;
  chaptersDone: number;
  quizAvg: number;
  weeklyHours: number[];
  subjects: { name: string; hours: number; color: string }[];
  chaptersThisWeek: string[];
  aiSummary: string;
}

export default function ChildDetail() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [child, setChild] = useState<ChildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChildData() {
      if (!id) {
        setError('No student ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch student info
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select(`
            id,
            exam_type,
            target_date,
            users (
              full_name,
              email
            )
          `)
          .eq('id', parseInt(id))
          .single();

        if (studentError || !student) {
          setError('Student not found');
          setLoading(false);
          return;
        }

        const userInfo = (student as any).users;
        const name = userInfo?.full_name || userInfo?.email || 'Unknown';
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const examType = student.exam_type || '';
        const targetYear = student.target_date
          ? new Date(student.target_date).getFullYear()
          : '';
        const exam = examType ? `${examType}${targetYear ? ' ' + targetYear : ''}` : 'No exam set';

        // Fetch daily_progress for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateStr = sevenDaysAgo.toISOString().split('T')[0];

        const { data: progressData } = await supabase
          .from('daily_progress')
          .select('study_minutes, chapters_covered, quiz_score, date')
          .eq('student_id', parseInt(id))
          .gte('date', dateStr)
          .order('date', { ascending: true });

        // Build weekly hours array (last 7 days)
        const weeklyHours: number[] = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split('T')[0];
          const entry = (progressData || []).find((p: any) => p.date === dayStr);
          weeklyHours.push(entry ? Math.round((entry.study_minutes / 60) * 10) / 10 : 0);
        }

        // Total study hours
        const totalMinutes = (progressData || []).reduce(
          (sum: number, p: any) => sum + (p.study_minutes || 0),
          0
        );
        const studyHours = Math.round((totalMinutes / 60) * 10) / 10;

        // Chapters done this week
        const allChapters: string[] = [];
        (progressData || []).forEach((p: any) => {
          if (p.chapters_covered && Array.isArray(p.chapters_covered)) {
            allChapters.push(...p.chapters_covered);
          }
        });
        const chaptersDone = allChapters.length;

        // Quiz average
        const quizScores = (progressData || [])
          .filter((p: any) => p.quiz_score !== null && p.quiz_score !== undefined)
          .map((p: any) => p.quiz_score);
        const quizAvg = quizScores.length > 0
          ? Math.round(quizScores.reduce((sum: number, s: number) => sum + s, 0) / quizScores.length)
          : 0;

        // Subject breakdown from chapters_covered
        // Chapters are expected to be strings like "Physics - Topic" or just topics
        const subjectHoursMap: Record<string, number> = {};
        (progressData || []).forEach((p: any) => {
          if (p.chapters_covered && Array.isArray(p.chapters_covered)) {
            const minutesPerChapter = p.chapters_covered.length > 0
              ? (p.study_minutes || 0) / p.chapters_covered.length
              : 0;
            p.chapters_covered.forEach((ch: string) => {
              const parts = ch.split(/\s*[-—]\s*/);
              const subject = parts.length > 1 ? parts[0].trim() : 'Other';
              subjectHoursMap[subject] = (subjectHoursMap[subject] || 0) + minutesPerChapter;
            });
          }
        });

        const subjects = Object.entries(subjectHoursMap).map(([name, minutes]) => ({
          name,
          hours: Math.round((minutes / 60) * 10) / 10,
          color: SUBJECT_COLORS[name] || SUBJECT_COLORS.Other,
        }));
        subjects.sort((a, b) => b.hours - a.hours);

        // Fetch study_goals for progress info
        const { data: goals } = await supabase
          .from('study_goals')
          .select('progress_pct, exam_name')
          .eq('student_id', parseInt(id));

        const avgProgress = goals && goals.length > 0
          ? Math.round(goals.reduce((sum: number, g: any) => sum + (g.progress_pct || 0), 0) / goals.length)
          : 0;

        // AI summary placeholder
        const aiSummary = `Your child studied ${studyHours} hours this week${chaptersDone > 0 ? `, covering ${chaptersDone} chapters` : ''}. ${
          quizAvg > 0 ? `Average quiz score: ${quizAvg}%.` : ''
        } ${avgProgress > 0 ? `Overall goal progress: ${avgProgress}%.` : ''} Keep encouraging consistent study habits!`;

        setChild({
          name,
          initials,
          exam,
          studyHours,
          chaptersDone,
          quizAvg,
          weeklyHours,
          subjects: subjects.length > 0 ? subjects : [{ name: 'No data', hours: 0, color: '#9B9B9B' }],
          chaptersThisWeek: allChapters.length > 0 ? allChapters.slice(0, 10) : [],
          aiSummary,
        });
      } catch (err) {
        console.error('Error fetching child data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchChildData();
  }, [id]);

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Child Progress</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !child) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Child Progress</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 16 }}>
            {error || 'Unable to load child data'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxHour = Math.max(...child.weeklyHours, 1);
  const maxSubjectHours = Math.max(...child.subjects.map((s) => s.hours), 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Child Progress</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.childHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{child.initials}</Text>
          </View>
          <View>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childExam}>{child.exam}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{child.studyHours}h</Text>
            <Text style={styles.statLabel}>Study Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color={colors.success} />
            <Text style={styles.statValue}>{child.chaptersDone}</Text>
            <Text style={styles.statLabel}>Chapters Done</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy-outline" size={24} color={colors.warning} />
            <Text style={styles.statValue}>{child.quizAvg}%</Text>
            <Text style={styles.statLabel}>Quiz Avg</Text>
          </View>
        </View>

        {/* Weekly Study Hours Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Study Hours</Text>
          <View style={styles.chart}>
            {child.weeklyHours.map((hours: number, index: number) => (
              <View key={index} style={styles.chartColumn}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(hours / maxHour) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{DAYS[index]}</Text>
                <Text style={styles.chartValue}>{hours}h</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Subject Breakdown */}
        {child.subjects.length > 0 && child.subjects[0].name !== 'No data' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject Breakdown</Text>
            {child.subjects.map((subject) => (
              <View key={subject.name} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <View style={styles.subjectBarBg}>
                  <View
                    style={[
                      styles.subjectBarFill,
                      {
                        width: `${(subject.hours / maxSubjectHours) * 100}%`,
                        backgroundColor: subject.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.subjectHours}>{subject.hours}h</Text>
              </View>
            ))}
          </View>
        )}

        {/* Chapters Completed */}
        {child.chaptersThisWeek.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapters Completed This Week</Text>
            {child.chaptersThisWeek.map((chapter: string, index: number) => (
              <View key={index} style={styles.chapterRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.chapterText}>{chapter}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Summary */}
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={styles.aiCardTitle}>AI Summary</Text>
          </View>
          <Text style={styles.aiCardText}>{child.aiSummary}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    childHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '30',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
    },
    childName: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    childExam: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginTop: 6,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 14,
    },
    chart: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      height: 180,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartColumn: {
      flex: 1,
      alignItems: 'center',
    },
    barContainer: {
      flex: 1,
      width: 24,
      justifyContent: 'flex-end',
      marginBottom: 6,
    },
    bar: {
      width: '100%',
      borderRadius: 4,
      minHeight: 4,
    },
    chartLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },
    chartValue: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
    },
    subjectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    subjectName: {
      width: 90,
      fontSize: 14,
      color: colors.text,
    },
    subjectBarBg: {
      flex: 1,
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      overflow: 'hidden',
      marginHorizontal: 10,
    },
    subjectBarFill: {
      height: '100%',
      borderRadius: 5,
    },
    subjectHours: {
      width: 32,
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    chapterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chapterText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 10,
      flex: 1,
    },
    aiCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    aiCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    aiCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
    },
    aiCardText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
  });
