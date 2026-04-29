import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { sm2, Quality } from '@/lib/spaced-repetition';

interface FlashcardRow {
  id: number;
  front: string;
  back: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string | null;
}

export default function FlashcardStudy() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { subject } = useLocalSearchParams<{ subject: string }>();

  const [cards, setCards] = useState<FlashcardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [updating, setUpdating] = useState(false);

  const styles = makeStyles(colors);

  const fetchCards = useCallback(async () => {
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

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('flashcards')
      .select('id, front, back, ease_factor, interval, repetitions, next_review')
      .eq('student_id', student.id)
      .eq('subject', subject || '')
      .or(`next_review.lte.${now},next_review.is.null`);

    if (!error && data) {
      setCards(data);
    }
    setLoading(false);
  }, [user, subject]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleRate = async (label: string, quality: Quality) => {
    const card = cards[currentIndex];
    setUpdating(true);
    setRatings({ ...ratings, [card.id]: label });

    const updated = sm2(
      {
        ease_factor: card.ease_factor,
        interval: card.interval,
        repetitions: card.repetitions,
        next_review: card.next_review || new Date().toISOString(),
      },
      quality
    );

    await supabase
      .from('flashcards')
      .update({
        ease_factor: updated.ease_factor,
        interval: updated.interval,
        repetitions: updated.repetitions,
        next_review: updated.next_review,
      })
      .eq('id', card.id);

    setUpdating(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setCompleted(true);
    }
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

  if (cards.length === 0 && !completed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Session</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            All caught up!
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
            No cards due for review in {subject || 'this deck'}.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (completed) {
    const total = cards.length;
    const easy = Object.values(ratings).filter((r) => r === 'easy' || r === 'good').length;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <View style={styles.completedIcon}>
            <Ionicons name="trophy" size={64} color={colors.primary} />
          </View>
          <Text style={styles.completedTitle}>Session Complete!</Text>
          <Text style={styles.completedSubtitle}>
            Great work on reviewing your flashcards
          </Text>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cards Reviewed</Text>
              <Text style={styles.statValue}>{total}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Correct / Easy</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{easy}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Needs Review</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {total - easy}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Session</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.progress}>
          Card {currentIndex + 1} of {cards.length}
        </Text>

        {/* Flashcard */}
        <TouchableOpacity
          style={styles.flashcard}
          onPress={() => setIsFlipped(!isFlipped)}
          activeOpacity={0.9}
        >
          <View style={styles.cardSideLabel}>
            <Text style={styles.cardSideLabelText}>
              {isFlipped ? 'ANSWER' : 'QUESTION'}
            </Text>
          </View>
          <Text style={styles.cardText}>
            {isFlipped ? currentCard.back : currentCard.front}
          </Text>
          <Text style={styles.tapHint}>
            {isFlipped ? 'Tap to see question' : 'Tap to reveal answer'}
          </Text>
        </TouchableOpacity>

        {/* Rating Buttons */}
        {isFlipped && (
          <View style={styles.ratingRow}>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
              onPress={() => handleRate('again', 1 as Quality)}
              disabled={updating}
            >
              <Text style={[styles.ratingText, { color: colors.error }]}>Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}
              onPress={() => handleRate('hard', 2 as Quality)}
              disabled={updating}
            >
              <Text style={[styles.ratingText, { color: colors.warning }]}>Hard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
              onPress={() => handleRate('good', 4 as Quality)}
              disabled={updating}
            >
              <Text style={[styles.ratingText, { color: colors.success }]}>Good</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => handleRate('easy', 5 as Quality)}
              disabled={updating}
            >
              <Text style={[styles.ratingText, { color: colors.primary }]}>Easy</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    content: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progress: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 24,
    },
    flashcard: {
      width: '100%',
      minHeight: 280,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.primary + '40',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    cardSideLabel: {
      position: 'absolute',
      top: 14,
      left: 18,
    },
    cardSideLabelText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1,
    },
    cardText: {
      fontSize: 17,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 26,
    },
    tapHint: {
      position: 'absolute',
      bottom: 14,
      fontSize: 12,
      color: colors.textSecondary,
    },
    ratingRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 28,
      width: '100%',
    },
    ratingButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
    },
    ratingText: {
      fontSize: 14,
      fontWeight: '600',
    },
    completedContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    completedIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    completedTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    completedSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    statsCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 20,
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statLabel: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    doneButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 48,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 24,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
    },
  });
