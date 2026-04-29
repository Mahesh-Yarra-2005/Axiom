import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

export default function CreateFlashcard() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [cards, setCards] = useState([{ front: '', back: '' }]);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase.from('students').select('id').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setStudentId(data.id); });
    }
  }, [user?.id]);

  const addCard = () => {
    setCards([...cards, { front: '', back: '' }]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...cards];
    updated[index][field] = value;
    setCards(updated);
  };

  const handleSave = async () => {
    if (!subject) {
      Alert.alert('Required', 'Please select a subject');
      return;
    }
    if (!studentId) return;

    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      Alert.alert('Required', 'Add at least one card with front and back');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('flashcards').insert(
        validCards.map(c => ({
          student_id: studentId,
          subject,
          chapter: chapter || null,
          front: c.front.trim(),
          back: c.back.trim(),
        }))
      );

      if (error) throw error;
      Alert.alert('Saved', `${validCards.length} flashcard(s) created!`);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save flashcards');
    } finally {
      setSaving(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Flashcards</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Subject Chips */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Subject</Text>
        <View style={styles.chipRow}>
          {SUBJECTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                {
                  backgroundColor: subject === s ? colors.primary : colors.surface,
                  borderColor: subject === s ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSubject(s)}
            >
              <Text style={{ color: subject === s ? '#000' : colors.text, fontSize: 14 }}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chapter */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Chapter (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g., Thermodynamics"
          placeholderTextColor={colors.textSecondary}
          value={chapter}
          onChangeText={setChapter}
        />

        {/* Cards */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Cards ({cards.length})
        </Text>

        {cards.map((card, index) => (
          <View key={index} style={[styles.cardForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardNumber, { color: colors.primary }]}>#{index + 1}</Text>
              {cards.length > 1 && (
                <TouchableOpacity onPress={() => removeCard(index)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[styles.cardInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Front (question)"
              placeholderTextColor={colors.textSecondary}
              value={card.front}
              onChangeText={(v) => updateCard(index, 'front', v)}
              multiline
            />
            <TextInput
              style={[styles.cardInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Back (answer)"
              placeholderTextColor={colors.textSecondary}
              value={card.back}
              onChangeText={(v) => updateCard(index, 'back', v)}
              multiline
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addCardBtn, { borderColor: colors.primary }]}
          onPress={addCard}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, marginLeft: 6 }}>Add Card</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    saveBtn: { fontSize: 16, fontWeight: '600' },
    content: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
    },
    cardForm: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardNumber: { fontSize: 14, fontWeight: '600' },
    cardInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      marginBottom: 8,
      minHeight: 44,
    },
    addCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    },
  });
}
