import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

const EXAMS = [
  { id: 'jee_main', label: 'JEE Main', icon: '⚡' },
  { id: 'jee_advanced', label: 'JEE Advanced', icon: '🔬' },
  { id: 'neet', label: 'NEET', icon: '🩺' },
  { id: 'cbse_12', label: 'CBSE Board 12th', icon: '📖' },
  { id: 'cbse_10', label: 'CBSE Board 10th', icon: '📝' },
  { id: 'custom', label: 'Custom', icon: '✏️' },
];

export default function ExamSelectScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [examDate, setExamDate] = useState('');

  const handleGenerate = () => {
    router.push('/(student)/onboarding/study-plan');
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
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 32,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    examCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
      marginBottom: 14,
      borderWidth: 2,
      borderColor: colors.border,
    },
    examCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
    examIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    examLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    dateSection: {
      marginTop: 24,
    },
    dateLabel: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    dateInput: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    generateButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 32,
      marginBottom: 32,
      opacity: selectedExam ? 1 : 0.5,
    },
    generateButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>What are you preparing for?</Text>
        <Text style={styles.subtitle}>Select your target exam</Text>

        <View style={styles.grid}>
          {EXAMS.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={[
                styles.examCard,
                selectedExam === exam.id && styles.examCardSelected,
              ]}
              onPress={() => setSelectedExam(exam.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.examIcon}>{exam.icon}</Text>
              <Text style={styles.examLabel}>{exam.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Tentative exam date</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textSecondary}
            value={examDate}
            onChangeText={setExamDate}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerate}
          activeOpacity={0.8}
          disabled={!selectedExam}
        >
          <Text style={styles.generateButtonText}>Generate Study Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
