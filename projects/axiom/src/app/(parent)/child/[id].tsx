import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const CHILD_DATA: Record<string, any> = {
  '1': {
    name: 'Arjun Sharma',
    initials: 'AS',
    exam: 'JEE Advanced 2025',
    studyHours: 42,
    chaptersDone: 18,
    quizAvg: 76,
    weeklyHours: [2.5, 3, 1.5, 4, 3.5, 2, 1],
    subjects: [
      { name: 'Physics', hours: 14, color: '#4A90D9' },
      { name: 'Chemistry', hours: 11, color: '#7B68EE' },
      { name: 'Mathematics', hours: 12, color: '#D4AF37' },
      { name: 'Biology', hours: 5, color: '#50C878' },
    ],
    chaptersThisWeek: [
      'Physics — Rotational Mechanics',
      'Chemistry — Aldehydes & Ketones',
      'Math — Integration by Parts',
      'Physics — Fluid Dynamics',
    ],
    aiSummary:
      'Your child studied 8.5 hours this week, focusing on Physics Mechanics. They\'re on track for their JEE preparation. Quiz scores improved by 8% in Physics. Consider encouraging more time on Mathematics.',
  },
  '2': {
    name: 'Priya Sharma',
    initials: 'PS',
    exam: 'NEET 2025',
    studyHours: 28,
    chaptersDone: 12,
    quizAvg: 68,
    weeklyHours: [1.5, 2, 3, 2.5, 1, 0.5, 2],
    subjects: [
      { name: 'Physics', hours: 6, color: '#4A90D9' },
      { name: 'Chemistry', hours: 8, color: '#7B68EE' },
      { name: 'Mathematics', hours: 4, color: '#D4AF37' },
      { name: 'Biology', hours: 10, color: '#50C878' },
    ],
    chaptersThisWeek: [
      'Biology — Cell Division',
      'Chemistry — Chemical Bonding',
      'Physics — Optics',
    ],
    aiSummary:
      'Priya completed 6.5 hours this week with a strong focus on Biology. Her Chemistry scores need improvement. Recommend scheduled breaks to manage exam stress.',
  },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ChildDetail() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const child = CHILD_DATA[id || '1'] || CHILD_DATA['1'];
  const maxHour = Math.max(...child.weeklyHours);
  const maxSubjectHours = Math.max(...child.subjects.map((s: any) => s.hours));

  const styles = makeStyles(colors);

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Breakdown</Text>
          {child.subjects.map((subject: any) => (
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

        {/* Chapters Completed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chapters Completed This Week</Text>
          {child.chaptersThisWeek.map((chapter: string, index: number) => (
            <View key={index} style={styles.chapterRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.chapterText}>{chapter}</Text>
            </View>
          ))}
        </View>

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
