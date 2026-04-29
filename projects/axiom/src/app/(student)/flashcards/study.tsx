import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const FLASHCARDS = [
  {
    id: '1',
    front: 'What is the moment of inertia of a solid sphere about its diameter?',
    back: 'I = (2/5)MR²\n\nWhere M is the mass and R is the radius of the sphere.',
  },
  {
    id: '2',
    front: 'State the parallel axis theorem.',
    back: 'I = I_cm + Md²\n\nWhere I_cm is the moment of inertia about the center of mass, M is the total mass, and d is the distance between the two parallel axes.',
  },
  {
    id: '3',
    front: 'What is the relationship between torque and angular acceleration?',
    back: 'τ = Iα\n\nTorque equals moment of inertia times angular acceleration. This is the rotational analog of F = ma.',
  },
  {
    id: '4',
    front: 'Define angular momentum and state its SI unit.',
    back: 'Angular momentum (L) = Iω = r × p\n\nSI unit: kg·m²/s\n\nIt is conserved when net external torque is zero.',
  },
  {
    id: '5',
    front: 'What is the condition for pure rolling without slipping?',
    back: 'v_cm = Rω\n\nThe velocity of the center of mass equals the radius times the angular velocity. Also, the point of contact has zero velocity relative to the surface.',
  },
];

export default function FlashcardStudy() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>({});

  const styles = makeStyles(colors);
  const currentCard = FLASHCARDS[currentIndex];

  const handleRate = (rating: string) => {
    setRatings({ ...ratings, [currentCard.id]: rating });
    if (currentIndex < FLASHCARDS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    const total = FLASHCARDS.length;
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
          Card {currentIndex + 1} of {FLASHCARDS.length}
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
              onPress={() => handleRate('again')}
            >
              <Text style={[styles.ratingText, { color: colors.error }]}>Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}
              onPress={() => handleRate('hard')}
            >
              <Text style={[styles.ratingText, { color: colors.warning }]}>Hard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
              onPress={() => handleRate('good')}
            >
              <Text style={[styles.ratingText, { color: colors.success }]}>Good</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => handleRate('easy')}
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
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
    },
  });
