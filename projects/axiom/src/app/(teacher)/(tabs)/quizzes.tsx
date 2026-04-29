import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useTeacherStore } from '@/stores/teacherStore';

export default function TeacherQuizzesScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { quizzes, fetchTeacherData, publishQuiz } = useTeacherStore();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  useEffect(() => {
    if (user?.id) fetchTeacherData(user.id);
  }, [user?.id]);

  const filteredQuizzes = quizzes.filter(q => filter === 'all' || q.status === filter);

  const handlePublish = (quizId: string, title: string) => {
    Alert.alert(
      'Publish Quiz',
      `Publish "${title}" to all linked students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: () => publishQuiz(quizId) },
      ]
    );
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Quizzes</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(teacher)/quiz/create' as any)}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(['all', 'draft', 'published', 'archived'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quizzes.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quizzes.filter(q => q.status === 'published').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {quizzes.reduce((s, q) => s + q.attemptCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Attempts</Text>
          </View>
        </View>

        {/* Quiz List */}
        {filteredQuizzes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="help-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No quizzes yet</Text>
            <Text style={styles.emptySubtext}>
              Create quizzes to assess your students' understanding
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(teacher)/quiz/create' as any)}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.emptyButtonText}>Create First Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredQuizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              style={styles.quizCard}
              onPress={() => router.push(`/(teacher)/quiz/${quiz.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.quizCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <Text style={styles.quizSubject}>{quiz.subject}{quiz.chapter ? ` · ${quiz.chapter}` : ''}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: quiz.status === 'published' ? '#4CAF5020' : quiz.status === 'draft' ? '#FF980020' : '#9E9E9E20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: quiz.status === 'published' ? '#4CAF50' : quiz.status === 'draft' ? '#FF9800' : '#9E9E9E' }
                  ]}>
                    {quiz.status}
                  </Text>
                </View>
              </View>

              <View style={styles.quizStats}>
                <View style={styles.quizStat}>
                  <Ionicons name="help-circle-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.quizStatText}>{quiz.questionCount} questions</Text>
                </View>
                {quiz.timeLimit && (
                  <View style={styles.quizStat}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.quizStatText}>{quiz.timeLimit} min</Text>
                  </View>
                )}
                <View style={styles.quizStat}>
                  <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.quizStatText}>{quiz.attemptCount} attempts</Text>
                </View>
                <View style={styles.quizStat}>
                  <Ionicons name="star-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.quizStatText}>{quiz.totalMarks} marks</Text>
                </View>
              </View>

              {quiz.status === 'draft' && (
                <TouchableOpacity
                  style={styles.publishButton}
                  onPress={() => handlePublish(quiz.id, quiz.title)}
                >
                  <Ionicons name="paper-plane" size={14} color={colors.primary} />
                  <Text style={styles.publishButtonText}>Publish to Students</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  createButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#FFF' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  quizCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  quizCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  quizTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  quizSubject: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  quizStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quizStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quizStatText: { fontSize: 12, color: colors.textSecondary },
  publishButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: colors.border },
  publishButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  emptyState: { backgroundColor: colors.surface, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, gap: 6 },
  emptyButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
