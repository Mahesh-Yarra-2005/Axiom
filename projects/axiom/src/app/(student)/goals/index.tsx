import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const WEEKLY_HOURS = [
  { day: 'Mon', hours: 3.5 },
  { day: 'Tue', hours: 4.0 },
  { day: 'Wed', hours: 2.0 },
  { day: 'Thu', hours: 5.0 },
  { day: 'Fri', hours: 3.0 },
  { day: 'Sat', hours: 1.5 },
  { day: 'Sun', hours: 2.5 },
];

const SUBJECT_PROGRESS = [
  { name: 'Physics', progress: 65, color: '#4A90D9' },
  { name: 'Chemistry', progress: 40, color: '#7B68EE' },
  { name: 'Mathematics', progress: 72, color: '#D4AF37' },
  { name: 'Biology', progress: 55, color: '#50C878' },
];

export default function GoalsIndex() {
  const { colors } = useThemeStore();
  const router = useRouter();

  const styles = makeStyles(colors);
  const maxHours = Math.max(...WEEKLY_HOURS.map((d) => d.hours));

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
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Ionicons name="flag" size={24} color={colors.primary} />
            <Text style={styles.goalTitle}>JEE Advanced 2025</Text>
          </View>
          <Text style={styles.goalDate}>Target: June 15, 2025</Text>
          <View style={styles.countdownRow}>
            <Ionicons name="time-outline" size={18} color={colors.warning} />
            <Text style={styles.countdownText}>45 days left</Text>
          </View>
        </View>

        {/* Progress Circle */}
        <View style={styles.progressCircleCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>58%</Text>
            <Text style={styles.progressLabel}>Overall</Text>
          </View>
          <Text style={styles.progressDescription}>
            You've completed 58% of your study plan
          </Text>
        </View>

        {/* Weekly Study Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Study Hours</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {WEEKLY_HOURS.map((item) => (
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
              <Text style={styles.chartTotalValue}>
                {WEEKLY_HOURS.reduce((acc, d) => acc + d.hours, 0).toFixed(1)}h
              </Text>
            </View>
          </View>
        </View>

        {/* Subject Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Progress</Text>
          {SUBJECT_PROGRESS.map((subject) => (
            <View key={subject.name} style={styles.subjectRow}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectPercent}>{subject.progress}%</Text>
              </View>
              <View style={styles.subjectBarBg}>
                <View
                  style={[
                    styles.subjectBarFill,
                    { width: `${subject.progress}%`, backgroundColor: subject.color },
                  ]}
                />
              </View>
            </View>
          ))}
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
    subjectRow: {
      marginBottom: 16,
    },
    subjectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    subjectName: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    subjectPercent: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    subjectBarBg: {
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      overflow: 'hidden',
    },
    subjectBarFill: {
      height: '100%',
      borderRadius: 5,
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
