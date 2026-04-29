import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

interface LinkedStudent {
  id: string;
  name: string;
  initials: string;
  examType: string | null;
  lastActive: string;
  studyHours: number;
}

export default function TeacherStudentsScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [teacherCode, setTeacherCode] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeacherData = useCallback(async () => {
    if (!user?.id) return;

    // Ensure teacher record exists
    let { data: teacher } = await supabase
      .from('teachers')
      .select('id, teacher_code')
      .eq('user_id', user.id)
      .single();

    if (!teacher) {
      const { data: newTeacher } = await supabase
        .from('teachers')
        .insert({ user_id: user.id })
        .select('id, teacher_code')
        .single();
      teacher = newTeacher;
    }

    if (!teacher) { setLoading(false); return; }

    setTeacherCode(teacher.teacher_code);
    setTeacherId(teacher.id);

    // Fetch linked students
    const { data: links } = await supabase
      .from('teacher_student_links')
      .select(`
        student_id,
        students (
          id, exam_type,
          users ( full_name, email )
        )
      `)
      .eq('teacher_id', teacher.id);

    if (!links) { setLoading(false); return; }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const enriched: LinkedStudent[] = await Promise.all(
      links.map(async (link: any) => {
        const student = link.students;
        const userInfo = student?.users;
        const name = userInfo?.full_name || userInfo?.email?.split('@')[0] || 'Student';
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

        const { data: progress } = await supabase
          .from('daily_progress')
          .select('study_minutes, date')
          .eq('student_id', student.id)
          .gte('date', dateStr)
          .order('date', { ascending: false });

        const totalMins = (progress || []).reduce((s: number, p: any) => s + (p.study_minutes || 0), 0);
        let lastActive = 'No data';
        if (progress?.length) {
          const diff = Math.floor((Date.now() - new Date(progress[0].date).getTime()) / 86400000);
          lastActive = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff}d ago`;
        }

        return {
          id: String(student.id),
          name,
          initials,
          examType: student.exam_type,
          lastActive,
          studyHours: Math.round((totalMins / 60) * 10) / 10,
        };
      })
    );

    setStudents(enriched);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchTeacherData(); }, [fetchTeacherData]);

  const handleCopyCode = () => Alert.alert('Teacher Code', teacherCode || '---', [{ text: 'OK' }]);
  const displayCode = teacherCode || '------';

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>My Students</Text>

        {/* Teacher Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeCardTitle}>Your Teacher Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue}>{displayCode}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            Share this code with students. They enter it in their Profile → Link Teacher.
          </Text>
        </View>

        {/* Students List */}
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No students linked yet</Text>
            <Text style={styles.emptySubtext}>Students can link using your teacher code above</Text>
          </View>
        ) : (
          students.map((s) => (
            <View key={s.id} style={styles.studentCard}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{s.initials}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.studentName}>{s.name}</Text>
                  <Text style={styles.studentMeta}>
                    {s.examType || 'No exam set'} · Last active: {s.lastActive}
                  </Text>
                </View>
                <View style={styles.hoursBadge}>
                  <Text style={styles.hoursText}>{s.studyHours}h</Text>
                  <Text style={styles.hoursLabel}>this week</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 20 },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeValue: { fontSize: 28, fontWeight: '700', color: colors.primary, letterSpacing: 4 },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  codeHint: { fontSize: 12, color: colors.textSecondary, marginTop: 12, lineHeight: 18 },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '25',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  studentName: { fontSize: 16, fontWeight: '600', color: colors.text },
  studentMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  hoursBadge: { alignItems: 'center' },
  hoursText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  hoursLabel: { fontSize: 10, color: colors.textSecondary },
});
