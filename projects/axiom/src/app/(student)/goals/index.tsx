import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

interface StudyGoal {
  exam_name: string;
  target_date: string | null;
  target_score: string | null;
  progress_pct: number;
}

interface DailyEntry {
  date: string;
  study_minutes: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function GoalsIndex() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const styles = makeStyles(colors);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!student) {
      setLoading(false);
      return;
    }

    // Fetch active goal
    const { data: goals } = await supabase
      .from('study_goals')
      .select('exam_name, target_date, target_score, progress_pct')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (goals && goals.length > 0) {
      const g = goals[0];
      setGoal(g);
      if (g.target_date) {
        const target = new Date(g.target_date);
        const now = new Date();
        const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(diff > 0 ? diff : 0);
      }
    }

    // Fetch last 7 days of daily_progress
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data: progress } = await supabase
      .from('daily_progress')
      .select('date, study_minutes')
      .eq('student_id', student.id)
      .gte('date', startDate)
      .order('date', { ascending: true });

    // Build 7-day array
    const dayMap: Record<string, number> = {};
    if (progress) {
      for (const p of progress) {
        dayMap[p.date] = p.study_minutes;
      }
    }

    const weekly: { day: string; hours: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = DAY_LABELS[d.getDay()];
      const minutes = dayMap[dateStr] || 0;
      weekly.push({ day: dayLabel, hours: parseFloat((minutes / 60).toFixed(1)) });
    }
    setWeeklyData(weekly);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1);
  const totalWeekHours = weeklyData.reduce((acc, d) => acc + d.hours, 0).toFixed(1);
  const progressPct = goal?.progress_pct ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Goals</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Goal Card */}
        {goal ? (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="flag" size={24} color={colors.primary} />
              <Text style={styles.goalTitle}>{goal.exam_name}</Text>
            </View>
            {goal.target_date && (
              <Text style={styles.goalDate}>
                Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
            {daysRemaining !== null && (
              <View style={styles.countdownRow}>
                <Ionicons name="time-outline" size={18} color={colors.warning} />
                <Text style={styles.countdownText}>{daysRemaining} days left</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.goalCard}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 12 }}>
                Set Your Goal
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center' }}>
                Define your exam target to track progress and stay motivated.
              </Text>
            </View>
          </View>
        )}

        {/* Progress Circle */}
        <View style={styles.progressCircleCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>{Math.round(progressPct)}%</Text>
            <Text style={styles.progressLabel}>Overall</Text>
          </View>
          <Text style={styles.progressDescription}>
            You've completed {Math.round(progressPct)}% of your study plan
          </Text>
        </View>

        {/* Weekly Study Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Study Hours</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {weeklyData.map((item) => (
                <View key={item.day} style={styles.chartColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(item.hours / maxHours) * 100}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartDay}>{item.day}</Text>
                  <Text style={styles.chartHours}>{item.hours}h</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartTotal}>
              <Text style={styles.chartTotalLabel}>Total this week</Text>
              <Text style={styles.chartTotalValue}>{totalWeekHours}h</Text>
            </View>
          </View>
        </View>

        {/* Update Goal Button */}
        <TouchableOpacity style={styles.updateButton}>
          <Ionicons name="create-outline" size={20} color="#000" />
          <Text style={styles.updateButtonText}>Update Goal</Text>
        </TouchableOpacity>
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
    goalCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    goalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 10,
    },
    goalDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      marginLeft: 34,
    },
    countdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 34,
    },
    countdownText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.warning,
      marginLeft: 6,
    },
    progressCircleCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 6,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    progressPercent: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
    },
    progressLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    progressDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chart: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 140,
      marginBottom: 12,
    },
    chartColumn: {
      flex: 1,
      alignItems: 'center',
    },
    barContainer: {
      flex: 1,
      width: 22,
      justifyContent: 'flex-end',
      marginBottom: 6,
    },
    bar: {
      width: '100%',
      borderRadius: 4,
      minHeight: 4,
    },
    chartDay: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    chartHours: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
    },
    chartTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    chartTotalLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    chartTotalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    updateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
    },
    updateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
      marginLeft: 8,
    },
  });
