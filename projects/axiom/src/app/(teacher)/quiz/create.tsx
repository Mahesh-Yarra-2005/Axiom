import React, { useState } from 'react';
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
import { useTeacherStore } from '@/stores/teacherStore';
import { supabase } from '@/lib/supabase';

interface QuizQuestion {
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'numerical' | 'true_false';
  options: { id: string; text: string; is_correct: boolean }[];
  correct_answer: string;
  explanation: string;
  marks: number;
  difficulty: number;
  blooms_level: string;
}

export default function CreateQuizScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { createQuiz } = useTeacherStore();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState('5');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add question manually
  const addEmptyQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      question_type: 'mcq',
      options: [
        { id: 'a', text: '', is_correct: true },
        { id: 'b', text: '', is_correct: false },
        { id: 'c', text: '', is_correct: false },
        { id: 'd', text: '', is_correct: false },
      ],
      correct_answer: 'a',
      explanation: '',
      marks: 1,
      difficulty: 3,
      blooms_level: 'understand',
    }]);
  };

  // AI Generate Questions
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      Alert.alert('Enter a topic', 'Please enter a topic to generate questions for.');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: aiTopic,
          subject: subject || aiTopic,
          count: parseInt(aiCount) || 5,
          difficulty: aiDifficulty,
          question_type: 'mcq',
        },
      });

      if (error) throw error;

      if (data?.questions) {
        setQuestions([...questions, ...data.questions]);
        setShowAIPanel(false);
        Alert.alert('Success', `Generated ${data.questions.length} questions!`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  // Save quiz
  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a quiz title.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Subject required', 'Please enter a subject.');
      return;
    }
    if (questions.length === 0) {
      Alert.alert('No questions', 'Add at least one question to your quiz.');
      return;
    }

    setSaving(true);
    const quizId = await createQuiz({
      title,
      subject,
      chapter,
      timeLimit: parseInt(timeLimit) || undefined,
      is_ai_generated: questions.some((q: any) => q._ai_generated),
      questions,
    });

    if (quizId && publish) {
      const { publishQuiz } = useTeacherStore.getState();
      await publishQuiz(quizId);
    }

    setSaving(false);

    if (quizId) {
      Alert.alert('Saved!', publish ? 'Quiz published to students.' : 'Quiz saved as draft.');
      router.back();
    } else {
      Alert.alert('Error', 'Failed to save quiz.');
    }
  };

  // Update question
  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Quiz</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Quiz Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quiz Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Quiz Title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Subject"
              placeholderTextColor={colors.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Chapter (optional)"
              placeholderTextColor={colors.textSecondary}
              value={chapter}
              onChangeText={setChapter}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Time Limit (minutes)"
            placeholderTextColor={colors.textSecondary}
            value={timeLimit}
            onChangeText={setTimeLimit}
            keyboardType="numeric"
          />
        </View>

        {/* AI Generation Panel */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => setShowAIPanel(!showAIPanel)}
        >
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={styles.aiButtonText}>Generate with AI</Text>
          <Ionicons name={showAIPanel ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showAIPanel && (
          <View style={styles.aiPanel}>
            <TextInput
              style={styles.input}
              placeholder="Topic (e.g., Newton's Laws of Motion)"
              placeholderTextColor={colors.textSecondary}
              value={aiTopic}
              onChangeText={setAiTopic}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Number of questions"
                placeholderTextColor={colors.textSecondary}
                value={aiCount}
                onChangeText={setAiCount}
                keyboardType="numeric"
              />
              <View style={[styles.input, { flex: 1, justifyContent: 'center' }]}>
                <View style={styles.difficultyRow}>
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.diffChip, aiDifficulty === d && styles.diffChipActive]}
                      onPress={() => setAiDifficulty(d)}
                    >
                      <Text style={[styles.diffText, aiDifficulty === d && styles.diffTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleAIGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                  <Text style={styles.generateBtnText}>Generate Questions</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Questions List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Questions ({questions.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={addEmptyQuestion}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.addBtnText}>Add Manual</Text>
            </TouchableOpacity>
          </View>

          {questions.map((q, index) => (
            <View key={index} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={styles.questionBadges}>
                  <View style={[styles.bloomsBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={styles.bloomsText}>{q.blooms_level}</Text>
                  </View>
                  <Text style={styles.marksBadge}>{q.marks} mark{q.marks > 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => removeQuestion(index)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.questionInput}
                placeholder="Enter question..."
                placeholderTextColor={colors.textSecondary}
                value={q.question_text}
                onChangeText={(text) => updateQuestion(index, 'question_text', text)}
                multiline
              />

              {q.question_type === 'mcq' && q.options && (
                <View style={styles.optionsContainer}>
                  {q.options.map((opt, optIdx) => (
                    <View key={opt.id} style={styles.optionRow}>
                      <TouchableOpacity
                        style={[
                          styles.optionRadio,
                          opt.is_correct && styles.optionRadioCorrect,
                        ]}
                        onPress={() => {
                          const newOptions = q.options.map((o, i) => ({
                            ...o,
                            is_correct: i === optIdx,
                          }));
                          updateQuestion(index, 'options', newOptions);
                        }}
                      >
                        {opt.is_correct && <Ionicons name="checkmark" size={12} color="#FFF" />}
                      </TouchableOpacity>
                      <TextInput
                        style={styles.optionInput}
                        placeholder={`Option ${opt.id.toUpperCase()}`}
                        placeholderTextColor={colors.textSecondary}
                        value={opt.text}
                        onChangeText={(text) => {
                          const newOptions = [...q.options];
                          newOptions[optIdx] = { ...newOptions[optIdx], text };
                          updateQuestion(index, 'options', newOptions);
                        }}
                      />
                    </View>
                  ))}
                </View>
              )}

              <TextInput
                style={[styles.questionInput, { fontSize: 12, marginTop: 8 }]}
                placeholder="Explanation (shown after answer)"
                placeholderTextColor={colors.textSecondary}
                value={q.explanation}
                onChangeText={(text) => updateQuestion(index, 'explanation', text)}
                multiline
              />
            </View>
          ))}
        </View>

        {/* Actions */}
        {questions.length > 0 && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.saveDraftBtn}
              onPress={() => handleSave(false)}
              disabled={saving}
            >
              <Text style={styles.saveDraftText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.publishBtn}
              onPress={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#FFF" />
                  <Text style={styles.publishText}>Publish</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },

  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', borderRadius: 12, padding: 14, marginBottom: 10, gap: 8, borderWidth: 1, borderColor: colors.primary + '30' },
  aiButtonText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary },

  aiPanel: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  difficultyRow: { flexDirection: 'row', gap: 6 },
  diffChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.card },
  diffChipActive: { backgroundColor: colors.primary },
  diffText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  diffTextActive: { color: '#FFF' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 12, padding: 12, gap: 8, marginTop: 8 },
  generateBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  questionCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  questionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  questionNumber: { fontSize: 14, fontWeight: '700', color: colors.primary },
  questionBadges: { flexDirection: 'row', gap: 8, flex: 1, marginLeft: 12 },
  bloomsBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  bloomsText: { fontSize: 10, fontWeight: '600', color: colors.primary, textTransform: 'capitalize' },
  marksBadge: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },

  questionInput: { fontSize: 14, color: colors.text, padding: 0, lineHeight: 20 },

  optionsContainer: { marginTop: 12, gap: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  optionRadioCorrect: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  optionInput: { flex: 1, fontSize: 13, color: colors.text, backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },

  actions: { flexDirection: 'row', gap: 12 },
  saveDraftBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  saveDraftText: { fontSize: 14, fontWeight: '600', color: colors.text },
  publishBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  publishText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
