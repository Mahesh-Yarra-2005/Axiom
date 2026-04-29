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
  const { setIsOnboarded, user } = useAuthStore();
  const { syllabus_text, exam_type, target_date } = useLocalSearchParams<{
    syllabus_text?: string;
    exam_type?: string;
    target_date?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState(PLACEHOLDER_PLAN);
  const [error, setError] = useState<string | null>(null);

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

        if (result?.plan && Array.isArray(result.plan)) {
          setPlan(result.plan);

          // Save to study_plans table
          if (user) {
            await supabase.from('study_plans').insert({
              user_id: user.id,
              exam_type: exam_type || null,
              target_date: target_date || null,
              plan_data: result.plan,
            });
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

  const handleComplete = () => {
    setIsOnboarded(true);
    router.replace('/(student)/(tabs)/home');
  };

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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
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
      backgroundColor: colors.primaryMuted,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginRight: 10,
    },
    weekBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    weekTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    topicText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 12,
      marginTop: 4,
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
            {plan.map((week) => (
              <View key={week.week} style={styles.weekCard}>
                <View style={styles.weekHeader}>
                  <View style={styles.weekBadge}>
                    <Text style={styles.weekBadgeText}>Week {week.week}</Text>
                  </View>
                  <Text style={styles.weekTitle}>{week.title}</Text>
                </View>
                {week.topics.map((topic, idx) => (
                  <Text key={idx} style={styles.topicText}>
                    • {topic}
                  </Text>
                ))}
              </View>
            ))}

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
