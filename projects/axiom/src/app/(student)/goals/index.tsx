import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
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
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarPicker({ value, onChange, colors }: {
  value: Date | null;
  onChange: (d: Date) => void;
  colors: any;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAYS.map(d => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const date = new Date(viewYear, viewMonth, day);
          const isSelected = value && date.toDateString() === value.toDateString();
          return (
            <TouchableOpacity
              key={day}
              style={{
                width: '14.28%',
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
                backgroundColor: isSelected ? colors.primary : 'transparent',
              }}
              onPress={() => onChange(date)}
            >
              <Text style={{
                color: isSelected ? '#000' : colors.text,
                fontSize: 14,
                fontWeight: isSelected ? '700' : '400',
              }}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function GoalsIndex() {
  const { colors } = useThemeStore();
  const { user, session } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editExamName, setEditExamName] = useState('');
  const [editTargetScore, setEditTargetScore] = useState('');
  const [editTargetDate, setEditTargetDate] = useState<Date | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = makeStyles(colors);

  const fetchData = useCallback(async () => {
    const currentUser = user ?? session?.user;
    if (!currentUser) return;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', currentUser.id)
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
  }, [user, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEditForm = () => {
    setEditExamName(goal?.exam_name ?? '');
    setEditTargetScore(goal?.target_score ?? '');
    setEditTargetDate(goal?.target_date ? new Date(goal.target_date) : null);
    setEditProgress(goal?.progress_pct ?? 0);
    setShowEditForm(true);
    setShowEditCalendar(false);
  };

  const handleSaveGoal = async () => {
    const currentUser = user ?? session?.user;
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (!student) throw new Error('Student record not found');

      const isoDate = editTargetDate ? editTargetDate.toISOString().split('T')[0] : null;

      // Check if a goal exists
      const { data: existingGoals } = await supabase
        .from('study_goals')
        .select('id')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const goalData = {
        student_id: student.id,
        exam_name: editExamName,
        target_score: editTargetScore || null,
        target_date: isoDate,
        progress_pct: editProgress,
      };

      if (existingGoals && existingGoals.length > 0) {
        const { error } = await supabase
          .from('study_goals')
          .update(goalData)
          .eq('id', existingGoals[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('study_goals')
          .insert(goalData);
        if (error) throw error;
      }

      setShowEditForm(false);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to save goal:', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d: Date) =>
    `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

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
        <TouchableOpacity style={styles.updateButton} onPress={openEditForm}>
          <Ionicons name="create-outline" size={20} color="#000" />
          <Text style={styles.updateButtonText}>Update Goal</Text>
        </TouchableOpacity>

        {/* Inline Edit Form */}
        {showEditForm && (
          <View style={styles.editForm}>
            <Text style={styles.editFormTitle}>
              {goal ? 'Update Goal' : 'Set Goal'}
            </Text>

            {/* Exam Name */}
            <Text style={styles.fieldLabel}>Exam Name</Text>
            <TextInput
              style={styles.textInput}
              value={editExamName}
              onChangeText={setEditExamName}
              placeholder="e.g. JEE Main 2026"
              placeholderTextColor={colors.textSecondary}
            />

            {/* Target Score */}
            <Text style={styles.fieldLabel}>Target Score</Text>
            <TextInput
              style={styles.textInput}
              value={editTargetScore}
              onChangeText={setEditTargetScore}
              placeholder="e.g. 250"
              placeholderTextColor={colors.textSecondary}
              keyboardType="default"
            />

            {/* Target Date */}
            <Text style={styles.fieldLabel}>Target Date</Text>
            <TouchableOpacity
              style={[styles.textInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setShowEditCalendar(v => !v)}
            >
              <Text style={{ color: editTargetDate ? colors.text : colors.textSecondary, fontSize: 15 }}>
                {editTargetDate ? formatDate(editTargetDate) : 'Pick a date'}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 18 }}>📅</Text>
            </TouchableOpacity>
            {showEditCalendar && (
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                <CalendarPicker
                  value={editTargetDate}
                  onChange={(d) => { setEditTargetDate(d); setShowEditCalendar(false); }}
                  colors={colors}
                />
              </View>
            )}

            {/* Progress % */}
            <Text style={styles.fieldLabel}>Progress: {editProgress}%</Text>
            <View style={styles.progressControls}>
              <TouchableOpacity
                style={styles.progressBtn}
                onPress={() => setEditProgress(p => Math.max(0, p - 5))}
              >
                <Text style={styles.progressBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${editProgress}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.progressBtn}
                onPress={() => setEditProgress(p => Math.min(100, p + 5))}
              >
                <Text style={styles.progressBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Save / Cancel */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.formButton, { backgroundColor: colors.surface, flex: 1 }]}
                onPress={() => setShowEditForm(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleSaveGoal}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={{ color: '#000', fontWeight: '700', fontSize: 15 }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    editForm: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editFormTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 12,
      fontWeight: '500',
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    progressBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressBtnText: {
      fontSize: 20,
      color: colors.text,
      fontWeight: '600',
      lineHeight: 24,
    },
    progressTrack: {
      flex: 1,
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    formButton: {
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
