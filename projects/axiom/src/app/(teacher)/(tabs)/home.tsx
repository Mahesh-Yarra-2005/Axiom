import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useTeacherStore } from '@/stores/teacherStore';

const { width } = Dimensions.get('window');

export default function TeacherHomeScreen() {
  const { colors } = useThemeStore();
  const { user, profile } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    students,
    classAnalytics,
    quizzes,
    assignments,
    announcements,
    loading,
    fetchTeacherData,
    detectAtRiskStudents,
  } = useTeacherStore();

  const firstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Teacher';

  useEffect(() => {
    if (user?.id) fetchTeacherData(user.id);
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) await fetchTeacherData(user.id);
    setRefreshing(false);
  };

  const atRiskStudents = detectAtRiskStudents();
  const activeToday = students.filter(s => s.lastActive === 'Today').length;
  const totalStudyHoursClass = students.reduce((s, st) => s + st.studyHoursThisWeek, 0);
  const avgQuizScore = students.length > 0
    ? Math.round(students.reduce((s, st) => s + st.averageQuizScore, 0) / students.length)
    : 0;

  // Determine time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const styles = makeStyles(colors);

  if (loading && students.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandText}>AXIOM</Text>
            <Text style={styles.greeting}>{greeting}, {firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBell}
            onPress={() => router.push('/(teacher)/announcements' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {atRiskStudents.length > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        {/* At-Risk Alert Banner */}
        {atRiskStudents.length > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push('/(teacher)/at-risk' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                {atRiskStudents.length} student{atRiskStudents.length > 1 ? 's' : ''} need attention
              </Text>
              <Text style={styles.alertSubtitle}>
                {atRiskStudents.map(s => s.name.split(' ')[0]).join(', ')} — declining engagement
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>{students.length}</Text>
            <Text style={styles.metricLabel}>Students</Text>
            <Text style={styles.metricSubvalue}>
              {activeToday} active today
            </Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <View style={[styles.metricIcon, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="time" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.metricValue}>{Math.round(totalStudyHoursClass)}h</Text>
            <Text style={styles.metricLabel}>Class Study</Text>
            <Text style={styles.metricSubvalue}>this week</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardSmall]}>
            <View style={[styles.metricIcon, { backgroundColor: '#FF980020' }]}>
              <Ionicons name="flash" size={18} color="#FF9800" />
            </View>
            <Text style={styles.metricValue}>{quizzes.filter(q => q.status === 'published').length}</Text>
            <Text style={styles.metricLabel}>Active Quizzes</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardSmall]}>
            <View style={[styles.metricIcon, { backgroundColor: '#9C27B020' }]}>
              <Ionicons name="clipboard" size={18} color="#9C27B0" />
            </View>
            <Text style={styles.metricValue}>{assignments.filter(a => a.status === 'active').length}</Text>
            <Text style={styles.metricLabel}>Assignments</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardSmall]}>
            <View style={[styles.metricIcon, { backgroundColor: '#2196F320' }]}>
              <Ionicons name="trending-up" size={18} color="#2196F3" />
            </View>
            <Text style={styles.metricValue}>{avgQuizScore}%</Text>
            <Text style={styles.metricLabel}>Avg Score</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardSmall]}>
            <View style={[styles.metricIcon, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
            </View>
            <Text style={styles.metricValue}>{atRiskStudents.length}</Text>
            <Text style={styles.metricLabel}>At Risk</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(teacher)/quiz/create' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FF980020' }]}>
              <Ionicons name="help-circle" size={24} color="#FF9800" />
            </View>
            <Text style={styles.quickActionText}>Create Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(teacher)/assignment/create' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#9C27B020' }]}>
              <Ionicons name="document-text" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.quickActionText}>New Assignment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(teacher)/announcement/create' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#2196F320' }]}>
              <Ionicons name="megaphone" size={24} color="#2196F3" />
            </View>
            <Text style={styles.quickActionText}>Announce</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(teacher)/share-notes' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="share" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.quickActionText}>Share Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(teacher)/analytics' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="analytics" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Student Performance Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Student Performance</Text>
          <TouchableOpacity onPress={() => router.push('/(teacher)/(tabs)/students' as any)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No students linked yet</Text>
            <Text style={styles.emptySubtext}>
              Share your teacher code with students to get started
            </Text>
          </View>
        ) : (
          students.slice(0, 5).map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentRow}
              onPress={() => router.push(`/(teacher)/student/${student.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.studentRowLeft}>
                <View style={[
                  styles.avatar,
                  student.riskLevel === 'high' && styles.avatarAtRisk,
                ]}>
                  <Text style={styles.avatarText}>{student.initials}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.studentNameRow}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    {student.riskLevel === 'high' && (
                      <View style={styles.riskBadge}>
                        <Ionicons name="warning" size={10} color="#EF4444" />
                      </View>
                    )}
                    {student.trend === 'improving' && (
                      <Ionicons name="trending-up" size={14} color="#4CAF50" style={{ marginLeft: 6 }} />
                    )}
                    {student.trend === 'declining' && (
                      <Ionicons name="trending-down" size={14} color="#EF4444" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                  <Text style={styles.studentMeta}>
                    {student.studyHoursThisWeek}h this week · Streak: {student.streakDays}d · Lvl {student.xpLevel}
                  </Text>
                </View>
              </View>
              <View style={styles.progressMini}>
                <Text style={styles.progressValue}>{student.flashcardsMastered}</Text>
                <Text style={styles.progressLabel}>mastered</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Quizzes */}
        {quizzes.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Recent Quizzes</Text>
              <TouchableOpacity onPress={() => router.push('/(teacher)/quizzes' as any)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {quizzes.slice(0, 3).map((quiz) => (
              <View key={quiz.id} style={styles.quizCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <Text style={styles.quizMeta}>
                    {quiz.subject} · {quiz.questionCount} questions · {quiz.attemptCount} attempts
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: quiz.status === 'published' ? '#4CAF5020' : '#FF980020' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: quiz.status === 'published' ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {quiz.status}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Recent Announcements */}
        {announcements.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Announcements</Text>
            </View>
            {announcements.slice(0, 3).map((ann) => (
              <View key={ann.id} style={styles.announcementCard}>
                <View style={styles.announcementIcon}>
                  <Ionicons
                    name={ann.type === 'urgent' ? 'alert-circle' : ann.type === 'reminder' ? 'alarm' : 'megaphone'}
                    size={18}
                    color={ann.type === 'urgent' ? '#EF4444' : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.announcementTitle}>{ann.title}</Text>
                  <Text style={styles.announcementMeta}>
                    {ann.readCount}/{ann.totalStudents} read · {new Date(ann.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Class Insights AI */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="bulb" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            {students.length > 0 ? (
              <>
                <Text style={styles.insightText}>
                  {atRiskStudents.length > 0
                    ? `${atRiskStudents.length} student(s) show declining engagement. Consider sending a motivational message or assigning lighter review tasks.`
                    : students.filter(s => s.trend === 'improving').length > students.length / 2
                    ? 'Great news! Most of your class is showing improving study patterns this week.'
                    : 'Your class is maintaining steady study habits. Consider introducing a quiz to boost engagement.'}
                </Text>
              </>
            ) : (
              <Text style={styles.insightText}>
                Connect with students to start receiving AI-powered class insights.
              </Text>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 20 },
  brandText: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: 2, marginBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.text },
  notificationBell: { position: 'relative', padding: 8 },
  notificationDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  alertIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DC262620', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  alertSubtitle: { fontSize: 12, color: '#FFCDD2', marginTop: 2 },

  // Metrics Grid
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  metricCardLarge: { width: (width - 50) / 2 },
  metricCardSmall: { width: (width - 60) / 4 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  metricLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  metricSubvalue: { fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: '500' },

  // Quick Actions
  quickActionsScroll: { marginBottom: 24 },
  quickAction: { alignItems: 'center', marginRight: 20, width: 72 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionText: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  seeAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Student Row
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarAtRisk: { borderColor: '#EF4444' },
  avatarText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  studentNameRow: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: 14, fontWeight: '600', color: colors.text },
  riskBadge: { marginLeft: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#EF444420', alignItems: 'center', justifyContent: 'center' },
  studentMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  progressMini: { alignItems: 'center', marginLeft: 8 },
  progressValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  progressLabel: { fontSize: 9, color: colors.textSecondary },

  // Quiz Card
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quizTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  quizMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  // Announcement Card
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  announcementIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  announcementTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  announcementMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Insight Card
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  insightText: { fontSize: 13, color: colors.text, lineHeight: 20 },

  // Empty State
  emptyState: { backgroundColor: colors.surface, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
