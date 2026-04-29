import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

interface DeckSummary {
  subject: string;
  totalCards: number;
  dueToday: number;
  mastered: number;
  progress: number;
}

export default function FlashcardsIndex() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [creating, setCreating] = useState(false);

  const styles = makeStyles(colors);

  const fetchStudentId = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return data?.id ?? null;
  }, [user]);

  const fetchDecks = useCallback(async (sid: number) => {
    const now = new Date().toISOString();
    const { data: cards, error } = await supabase
      .from('flashcards')
      .select('subject, ease_factor, interval, repetitions, next_review')
      .eq('student_id', sid);

    if (error || !cards) return;

    const grouped: Record<string, typeof cards> = {};
    for (const card of cards) {
      const subj = card.subject || 'General';
      if (!grouped[subj]) grouped[subj] = [];
      grouped[subj].push(card);
    }

    const summaries: DeckSummary[] = Object.entries(grouped).map(([subject, items]) => {
      const totalCards = items.length;
      const dueToday = items.filter(
        (c) => !c.next_review || c.next_review <= now
      ).length;
      const mastered = items.filter(
        (c) => c.ease_factor >= 2.5 && c.repetitions >= 3
      ).length;
      const progress = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;
      return { subject, totalCards, dueToday, mastered, progress };
    });

    setDecks(summaries);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const sid = await fetchStudentId();
      if (!mounted) return;
      if (sid) {
        setStudentId(sid);
        await fetchDecks(sid);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchStudentId, fetchDecks]);

  const handleCreateCard = async () => {
    if (!studentId || !newSubject.trim() || !newFront.trim() || !newBack.trim()) {
      Alert.alert('Missing fields', 'Please fill in subject, front, and back.');
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('flashcards').insert({
      student_id: studentId,
      subject: newSubject.trim(),
      front: newFront.trim(),
      back: newBack.trim(),
    });
    setCreating(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setNewSubject('');
    setNewFront('');
    setNewBack('');
    setShowCreateModal(false);
    await fetchDecks(studentId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {decks.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="albums-outline" size={64} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 12 }}>
              No flashcards yet
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
              Tap + to create your first card
            </Text>
          </View>
        )}
        {decks.map((deck) => (
          <TouchableOpacity
            key={deck.subject}
            style={styles.deckCard}
            onPress={() =>
              router.push({
                pathname: '/(student)/flashcards/study',
                params: { subject: deck.subject },
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.deckHeader}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{deck.subject}</Text>
              </View>
              {deck.dueToday > 0 && (
                <View style={styles.dueBadge}>
                  <Text style={styles.dueText}>{deck.dueToday} due</Text>
                </View>
              )}
            </View>

            <Text style={styles.deckTopic}>{deck.subject}</Text>
            <Text style={styles.deckMeta}>
              {deck.totalCards} cards · {deck.dueToday} due today
            </Text>

            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${deck.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{deck.progress}% mastered</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Create Card Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Flashcard</Text>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Subject (e.g. Physics)"
              placeholderTextColor={colors.textSecondary}
              value={newSubject}
              onChangeText={setNewSubject}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline, { color: colors.text, borderColor: colors.border }]}
              placeholder="Front (question)"
              placeholderTextColor={colors.textSecondary}
              value={newFront}
              onChangeText={setNewFront}
              multiline
            />
            <TextInput
              style={[styles.input, styles.inputMultiline, { color: colors.text, borderColor: colors.border }]}
              placeholder="Back (answer)"
              placeholderTextColor={colors.textSecondary}
              value={newBack}
              onChangeText={setNewBack}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateCard}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={{ color: '#000', fontWeight: '600' }}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      paddingBottom: 80,
    },
    deckCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deckHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    subjectBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    subjectText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    dueBadge: {
      backgroundColor: colors.warning + '20',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    dueText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.warning,
    },
    deckTopic: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    deckMeta: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    modalContent: {
      borderRadius: 16,
      padding: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      marginBottom: 12,
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 8,
    },
    modalBtn: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
