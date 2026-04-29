import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface WeeklyData {
  day: string;
  minutes: number;
}

export default function StudentDetailScreen() {
  const { colors } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { students } = useTeacherStore();

  const student = students.find(s => s.id === id);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [masteryData, setMasteryData] = useState<any[]>([]);

  useEffect(() => {
    if (id) fetchStudentDetails();
  }, [id]);

  const fetchStudentDetails = async () => {
    // Fetch 7-day progress
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: progress } = await supabase
      .from('daily_progress')
      .select('date, study_minutes, chapters_covered, quiz_score')
      .eq('student_id', id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Build weekly chart data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData: WeeklyData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayProgress = (progress || []).find((p: any) => p.date === dateStr);
      weekData.push({
        day: days[d.getDay()],
        minutes: dayProgress?.study_minutes || 0,
      });
    }
    setWeeklyData(weekData);

    // Fetch recent notes
    const { data: notes } = await supabase
      .from('notes')
      .select('id, title, subject, created_at')
      .eq('student_id', id)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentNotes(notes || []);

    // Fetch mastery data
    const { data: mastery } = await supabase
      .from('student_mastery')
      .select('mastery_level, confidence, knowledge_nodes(subject, topic)')
      .eq('student_id', id)
      .order('mastery_level', { ascending: true })
      .limit(10);
    setMasteryData(mastery || []);
  };

  if (!student) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Student not found</Text>
      </SafeAreaView>
    );
  }

  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 60);

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Detail</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Student Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, student.riskLevel === 'high' && { borderColor: '#EF4444' }]}>
            <Text style={styles.avatarText}>{student.initials}</Text>
          </View>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentMeta}>
            {student.examType || 'No exam'} · Level {student.xpLevel} · {student.totalXp} XP
          </Text>

          {/* Risk indicator */}
          {student.riskLevel !== 'low' && (
            <View style={[styles.riskIndicator, { backgroundColor: student.riskLevel === 'high' ? '#EF444420' : '#FF980020' }]}>
              <Ionicons name="warning" size={14} color={student.riskLevel === 'high' ? '#EF4444' : '#FF9800'} />
              <Text style={[styles.riskText, { color: student.riskLevel === 'high' ? '#EF4444' : '#FF9800' }]}>
                {student.riskLevel === 'high' ? 'High risk — declining engagement' : 'Moderate risk — below average activity'}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{student.studyHoursThisWeek}h</Text>
            <Text style={styles.statLabel}>This Week</Text>
            <View style={styles.trendIndicator}>
              <Ionicons
                name={student.trend === 'improving' ? 'trending-up' : student.trend === 'declining' ? 'trending-down' : 'remove'}
                size={14}
                color={student.trend === 'improving' ? '#4CAF50' : student.trend === 'declining' ? '#EF4444' : '#FF9800'}
              />
            </View>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{student.streakDays}d</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{student.flashcardsMastered}/{student.flashcardsTotal}</Text>
            <Text style={styles.statLabel}>Cards Mastered</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{student.averageQuizScore}%</Text>
            <Text style={styles.statLabel}>Avg Quiz</Text>
          </View>
        </View>

        {/* Weekly Study Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Weekly Study Time</Text>
          <View style={styles.chart}>
            {weeklyData.map((day, i) => (
              <View key={i} style={styles.chartBar}>
                <Text style={styles.chartValue}>
                  {day.minutes >= 60 ? `${(day.minutes / 60).toFixed(1)}h` : `${day.minutes}m`}
                </Text>
                <View style={[
                  styles.bar,
                  {
                    height: Math.max(4, (day.minutes / maxMinutes) * 80),
                    backgroundColor: day.minutes >= 60 ? '#4CAF50' : day.minutes >= 30 ? '#FF9800' : '#EF4444',
                  }
                ]} />
                <Text style={styles.chartLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weak Areas */}
        {masteryData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas Needing Attention</Text>
            {masteryData.slice(0, 5).map((m: any, i: number) => (
              <View key={i} style={styles.masteryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.masteryTopic}>{m.knowledge_nodes?.topic || 'Unknown'}</Text>
                  <Text style={styles.masterySubject}>{m.knowledge_nodes?.subject}</Text>
                </View>
                <View style={styles.masteryBar}>
                  <View style={[styles.masteryFill, { width: `${(m.mastery_level || 0) * 100}%` }]} />
                </View>
                <Text style={styles.masteryPercent}>{Math.round((m.mastery_level || 0) * 100)}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Notes */}
        {recentNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Notes</Text>
            {recentNotes.map((note: any) => (
              <View key={note.id} style={styles.noteRow}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  <Text style={styles.noteMeta}>{note.subject} · {new Date(note.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Teacher Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Send Encouragement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Assign Practice Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="flag-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Set Custom Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Notify Parent</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '20', borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.primary },
  studentName: { fontSize: 20, fontWeight: '700', color: colors.text },
  studentMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  riskIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  riskText: { fontSize: 12, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statBox: { width: (width - 50) / 2, backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  trendIndicator: { position: 'absolute', top: 14, right: 14 },

  chartSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  chartBar: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  chartValue: { fontSize: 9, color: colors.textSecondary, marginBottom: 4 },
  bar: { width: 24, borderRadius: 6, minHeight: 4 },
  chartLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 6 },

  section: { marginBottom: 24 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  masteryTopic: { fontSize: 13, fontWeight: '600', color: colors.text },
  masterySubject: { fontSize: 11, color: colors.textSecondary },
  masteryBar: { width: 60, height: 6, borderRadius: 3, backgroundColor: colors.border, marginHorizontal: 8, overflow: 'hidden' },
  masteryFill: { height: '100%', backgroundColor: '#EF4444', borderRadius: 3 },
  masteryPercent: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, width: 32, textAlign: 'right' },

  noteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  noteTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  noteMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  actionsSection: { marginBottom: 24 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  actionText: { fontSize: 14, fontWeight: '500', color: colors.text },
});
