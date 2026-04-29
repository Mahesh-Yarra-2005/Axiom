import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useTeacherStore } from '@/stores/teacherStore';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 60;

export default function TeacherAnalyticsScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { students, classAnalytics, fetchTeacherData } = useTeacherStore();
  const [selectedMetric, setSelectedMetric] = useState<'hours' | 'score' | 'streak'>('hours');

  useEffect(() => {
    if (user?.id) fetchTeacherData(user.id);
  }, [user?.id]);

  // Aggregate analytics
  const totalStudents = students.length;
  const avgHoursThisWeek = totalStudents > 0
    ? (students.reduce((s, st) => s + st.studyHoursThisWeek, 0) / totalStudents).toFixed(1)
    : '0';
  const avgHoursLastWeek = totalStudents > 0
    ? (students.reduce((s, st) => s + st.studyHoursLastWeek, 0) / totalStudents).toFixed(1)
    : '0';
  const improvingCount = students.filter(s => s.trend === 'improving').length;
  const decliningCount = students.filter(s => s.trend === 'declining').length;
  const highRiskCount = students.filter(s => s.riskLevel === 'high').length;
  const medRiskCount = students.filter(s => s.riskLevel === 'medium').length;

  // Performance distribution
  const performanceBuckets = {
    excellent: students.filter(s => s.studyHoursThisWeek >= 15).length,
    good: students.filter(s => s.studyHoursThisWeek >= 8 && s.studyHoursThisWeek < 15).length,
    average: students.filter(s => s.studyHoursThisWeek >= 3 && s.studyHoursThisWeek < 8).length,
    low: students.filter(s => s.studyHoursThisWeek < 3).length,
  };

  // Sort students by selected metric for ranking
  const rankedStudents = [...students].sort((a, b) => {
    if (selectedMetric === 'hours') return b.studyHoursThisWeek - a.studyHoursThisWeek;
    if (selectedMetric === 'score') return b.averageQuizScore - a.averageQuizScore;
    return b.streakDays - a.streakDays;
  });

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Class Analytics</Text>
        <Text style={styles.subtitle}>
          {totalStudents} students · Week of {new Date().toLocaleDateString()}
        </Text>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Avg Hours/Week</Text>
            <Text style={styles.overviewValue}>{avgHoursThisWeek}h</Text>
            <View style={styles.trendRow}>
              <Ionicons
                name={parseFloat(avgHoursThisWeek) >= parseFloat(avgHoursLastWeek) ? 'trending-up' : 'trending-down'}
                size={14}
                color={parseFloat(avgHoursThisWeek) >= parseFloat(avgHoursLastWeek) ? '#4CAF50' : '#EF4444'}
              />
              <Text style={[styles.trendText, {
                color: parseFloat(avgHoursThisWeek) >= parseFloat(avgHoursLastWeek) ? '#4CAF50' : '#EF4444'
              }]}>
                vs {avgHoursLastWeek}h last week
              </Text>
            </View>
          </View>

          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Engagement</Text>
            <Text style={styles.overviewValue}>
              {totalStudents > 0 ? Math.round((improvingCount / totalStudents) * 100) : 0}%
            </Text>
            <Text style={styles.trendText}>{improvingCount} improving</Text>
          </View>
        </View>

        {/* Risk Summary */}
        <View style={styles.riskSection}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <View style={styles.riskBars}>
            <View style={styles.riskRow}>
              <View style={[styles.riskDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.riskLabel}>On Track</Text>
              <View style={[styles.riskBar, { flex: totalStudents - highRiskCount - medRiskCount || 1, backgroundColor: '#4CAF5040' }]} />
              <Text style={styles.riskCount}>{totalStudents - highRiskCount - medRiskCount}</Text>
            </View>
            <View style={styles.riskRow}>
              <View style={[styles.riskDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.riskLabel}>Medium Risk</Text>
              <View style={[styles.riskBar, { flex: medRiskCount || 0.1, backgroundColor: '#FF980040' }]} />
              <Text style={styles.riskCount}>{medRiskCount}</Text>
            </View>
            <View style={styles.riskRow}>
              <View style={[styles.riskDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.riskLabel}>High Risk</Text>
              <View style={[styles.riskBar, { flex: highRiskCount || 0.1, backgroundColor: '#EF444440' }]} />
              <Text style={styles.riskCount}>{highRiskCount}</Text>
            </View>
          </View>
        </View>

        {/* Performance Distribution */}
        <View style={styles.distributionSection}>
          <Text style={styles.sectionTitle}>Study Hours Distribution</Text>
          <View style={styles.distributionChart}>
            {[
              { label: '15h+', count: performanceBuckets.excellent, color: '#4CAF50' },
              { label: '8-15h', count: performanceBuckets.good, color: '#2196F3' },
              { label: '3-8h', count: performanceBuckets.average, color: '#FF9800' },
              { label: '<3h', count: performanceBuckets.low, color: '#EF4444' },
            ].map((bucket) => (
              <View key={bucket.label} style={styles.barContainer}>
                <Text style={styles.barCount}>{bucket.count}</Text>
                <View style={[
                  styles.bar,
                  {
                    height: Math.max(4, (bucket.count / Math.max(totalStudents, 1)) * 100),
                    backgroundColor: bucket.color,
                  }
                ]} />
                <Text style={styles.barLabel}>{bucket.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Student Rankings */}
        <View style={styles.rankingSection}>
          <Text style={styles.sectionTitle}>Student Rankings</Text>
          <View style={styles.metricTabs}>
            {(['hours', 'score', 'streak'] as const).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[styles.metricTab, selectedMetric === metric && styles.metricTabActive]}
                onPress={() => setSelectedMetric(metric)}
              >
                <Text style={[styles.metricTabText, selectedMetric === metric && styles.metricTabTextActive]}>
                  {metric === 'hours' ? 'Study Hours' : metric === 'score' ? 'Quiz Score' : 'Streak'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {rankedStudents.slice(0, 10).map((student, index) => (
            <View key={student.id} style={styles.rankRow}>
              <Text style={[styles.rankNumber, index < 3 && { color: colors.primary }]}>
                #{index + 1}
              </Text>
              <View style={styles.rankAvatar}>
                <Text style={styles.rankAvatarText}>{student.initials}</Text>
              </View>
              <Text style={styles.rankName}>{student.name}</Text>
              <Text style={styles.rankValue}>
                {selectedMetric === 'hours' ? `${student.studyHoursThisWeek}h` :
                 selectedMetric === 'score' ? `${student.averageQuizScore}%` :
                 `${student.streakDays}d`}
              </Text>
            </View>
          ))}
        </View>

        {/* Trend Indicators */}
        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>Weekly Trends</Text>
          <View style={styles.trendGrid}>
            <View style={styles.trendCard}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.trendCardValue}>{improvingCount}</Text>
              <Text style={styles.trendCardLabel}>Improving</Text>
            </View>
            <View style={styles.trendCard}>
              <Ionicons name="remove" size={24} color="#FF9800" />
              <Text style={styles.trendCardValue}>{totalStudents - improvingCount - decliningCount}</Text>
              <Text style={styles.trendCardLabel}>Stable</Text>
            </View>
            <View style={styles.trendCard}>
              <Ionicons name="trending-down" size={24} color="#EF4444" />
              <Text style={styles.trendCardValue}>{decliningCount}</Text>
              <Text style={styles.trendCardLabel}>Declining</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 12 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },

  overviewGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  overviewCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  overviewLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  overviewValue: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  trendText: { fontSize: 11, color: colors.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },

  // Risk
  riskSection: { marginBottom: 24 },
  riskBars: { gap: 10 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  riskLabel: { fontSize: 12, color: colors.textSecondary, width: 80 },
  riskBar: { height: 24, borderRadius: 6, minWidth: 4 },
  riskCount: { fontSize: 13, fontWeight: '700', color: colors.text, width: 24, textAlign: 'right' },

  // Distribution
  distributionSection: { marginBottom: 24 },
  distributionChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  barContainer: { alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 36, borderRadius: 6, minHeight: 4 },
  barCount: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4 },
  barLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 6 },

  // Rankings
  rankingSection: { marginBottom: 24 },
  metricTabs: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  metricTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  metricTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  metricTabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  metricTabTextActive: { color: '#FFF' },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  rankNumber: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, width: 32 },
  rankAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankAvatarText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  rankName: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  rankValue: { fontSize: 14, fontWeight: '700', color: colors.primary },

  // Trends
  trendSection: { marginBottom: 24 },
  trendGrid: { flexDirection: 'row', gap: 10 },
  trendCard: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  trendCardValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 6 },
  trendCardLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
