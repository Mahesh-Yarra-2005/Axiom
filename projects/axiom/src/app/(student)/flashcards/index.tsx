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

const DECKS = [
  {
    id: '1',
    subject: 'Physics',
    topic: 'Mechanics',
    totalCards: 25,
    dueToday: 8,
    progress: 60,
  },
  {
    id: '2',
    subject: 'Chemistry',
    topic: 'Organic Reactions',
    totalCards: 30,
    dueToday: 5,
    progress: 45,
  },
  {
    id: '3',
    subject: 'Mathematics',
    topic: 'Calculus',
    totalCards: 20,
    dueToday: 12,
    progress: 35,
  },
  {
    id: '4',
    subject: 'Biology',
    topic: 'Cell Biology',
    totalCards: 18,
    dueToday: 3,
    progress: 78,
  },
];

export default function FlashcardsIndex() {
  const { colors } = useThemeStore();
  const router = useRouter();

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {DECKS.map((deck) => (
          <TouchableOpacity
            key={deck.id}
            style={styles.deckCard}
            onPress={() => router.push('/(student)/flashcards/study')}
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

            <Text style={styles.deckTopic}>
              {deck.subject} — {deck.topic}
            </Text>
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
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
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
  });
