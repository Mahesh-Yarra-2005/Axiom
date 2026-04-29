import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { callEdgeFunction } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const PLACEHOLDER_PLAN = [
  {
    week: 1,
    title: 'Physics — Mechanics & Kinematics',
    topics: ['Newton\'s Laws', 'Projectile Motion', 'Work-Energy Theorem'],
  },
  {
    week: 2,
    title: 'Chemistry — Atomic Structure & Bonding',
    topics: ['Quantum Numbers', 'Periodic Trends', 'Chemical Bonding'],
  },
  {
    week: 3,
    title: 'Mathematics — Calculus Foundations',
    topics: ['Limits & Continuity', 'Differentiation', 'Applications of Derivatives'],
  },
  {
    week: 4,
    title: 'Physics — Thermodynamics',
    topics: ['Laws of Thermodynamics', 'Heat Transfer', 'Carnot Engine'],
  },
  {
    week: 5,
    title: 'Chemistry — Organic Chemistry Basics',
    topics: ['Nomenclature', 'Isomerism', 'Reaction Mechanisms'],
  },
  {
    week: 6,
    title: 'Mathematics — Coordinate Geometry',
    topics: ['Straight Lines', 'Circles', 'Conic Sections'],
  },
];

export default function StudyPlanScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { setIsOnboarded, user, session } = useAuthStore();
  const { syllabus_text, exam_type, target_date } = useLocalSearchParams<{
    syllabus_text?: string;
    exam_type?: string;
    target_date?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState(PLACEHOLDER_PLAN);
  const [error, setError] = useState<string | null>(null);
  const [checkedTopics, setCheckedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function generatePlan() {
      try {
        const result = await callEdgeFunction('generate-study-plan', {
          syllabus_text: syllabus_text || '',
          exam_type: exam_type || '',
          target_date: target_date || '',
        });

        if (cancelled) return;

        // Handle both response shapes: { plan: [...] } or { weeks: [...] }
        const rawWeeks = result?.weeks || result?.plan;
        if (rawWeeks && Array.isArray(rawWeeks)) {
          const normalized = rawWeeks.map((w: any) => ({
            week: w.week,
            title: w.title || w.theme || `Week ${w.week}`,
            topics: w.topics
              ? w.topics
              : (w.subjects || []).flatMap((s: any) =>
                  (s.chapters || []).map((c: string) => `${s.name}: ${c}`)
                ),
          }));
          setPlan(normalized);

          // Save to study_plans table using correct schema
          const currentUser = user ?? session?.user;
          if (currentUser) {
            // Get student id first
            const { data: student } = await supabase
              .from('students')
              .select('id')
              .eq('user_id', currentUser.id)
              .single();

            if (student?.id) {
              await supabase.from('study_plans').insert({
                student_id: student.id,
                title: `${exam_type?.toUpperCase() || 'Study'} Plan`,
                milestones: result.plan,
                status: 'active',
              });
            }
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        console.warn('Failed to generate study plan, using fallback:', err.message);
        setError('Using a sample plan. You can regenerate later.');
        setPlan(PLACEHOLDER_PLAN);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    generatePlan();
    return () => { cancelled = true; };
  }, []);

  const toggleTopic = (weekNum: number, topicIdx: number) => {
    const key = `${weekNum}-${topicIdx}`;
    setCheckedTopics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getWeekCheckedCount = (weekNum: number, topicsLength: number) => {
    let count = 0;
    for (let i = 0; i < topicsLength; i++) {
      if (checkedTopics[`${weekNum}-${i}`]) count++;
    }
    return count;
  };

  const getTotalProgress = () => {
    let total = 0;
    let checked = 0;
    for (const week of plan) {
      total += week.topics.length;
      checked += getWeekCheckedCount(week.week, week.topics.length);
    }
    if (total === 0) return 0;
    return Math.round((checked / total) * 100);
  };

  const handleComplete = () => {
    setIsOnboarded(true);
    router.replace('/(student)/(tabs)/home');
  };

  const totalProgress = getTotalProgress();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 48,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    progressSubtitle: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    weekCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      marginBottom: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    weekHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    weekBadge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginRight: 10,
    },
    weekBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    weekTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    topicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 4,
      marginTop: 6,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 2,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicText: {
      fontSize: 13,
      flex: 1,
    },
    completeButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 32,
    },
    completeButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Your Study Plan</Text>
        <Text style={styles.subtitle}>
          Personalized based on your syllabus and target exam
        </Text>
        {!isLoading && (
          <Text style={styles.progressSubtitle}>
            {totalProgress}% complete
          </Text>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Axiom is creating your{'\n'}personalized plan...
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, fontStyle: 'italic' }}>
                {error}
              </Text>
            )}
            {plan.map((week) => {
              const checkedCount = getWeekCheckedCount(week.week, week.topics.length);
              const isWeekGold = checkedCount >= Math.ceil(week.topics.length / 2);
              return (
                <View key={week.week} style={styles.weekCard}>
                  <View style={styles.weekHeader}>
                    <View style={[
                      styles.weekBadge,
                      { backgroundColor: isWeekGold ? '#F59E0B' : colors.primaryMuted },
                    ]}>
                      <Text style={[
                        styles.weekBadgeText,
                        { color: isWeekGold ? '#000' : colors.primary },
                      ]}>Week {week.week}</Text>
                    </View>
                    <Text style={styles.weekTitle}>{week.title}</Text>
                  </View>
                  {week.topics.map((topic, idx) => {
                    const key = `${week.week}-${idx}`;
                    const isChecked = !!checkedTopics[key];
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.topicRow}
                        onPress={() => toggleTopic(week.week, idx)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkbox,
                          {
                            borderColor: isChecked ? '#F59E0B' : colors.border,
                            backgroundColor: isChecked ? '#F59E0B' : 'transparent',
                          },
                        ]}>
                          {isChecked && (
                            <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>✓</Text>
                          )}
                        </View>
                        <Text style={[
                          styles.topicText,
                          {
                            color: isChecked ? colors.textSecondary : colors.text,
                            textDecorationLine: isChecked ? 'line-through' : 'none',
                          },
                        ]}>
                          {topic}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.completeButtonText}>Looks Great!</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
