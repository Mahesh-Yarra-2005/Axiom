import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const FOCUS_TOPICS = [
  { id: '1', title: 'Newton\'s Third Law — Problems', done: false },
  { id: '2', title: 'Organic Chemistry — Nomenclature', done: true },
  { id: '3', title: 'Integration by Parts', done: false },
];

const QUICK_ACTIONS = [
  { id: 'chat', label: 'AI Chat', icon: 'chatbubble-ellipses' as const, route: '/(student)/(tabs)/chat' },
  { id: 'notes', label: 'My Notes', icon: 'document-text' as const, route: '/(student)/(tabs)/notes' },
  { id: 'videos', label: 'Video Hub', icon: 'play-circle' as const, route: '/(student)/videos' },
  { id: 'flashcards', label: 'Flashcards', icon: 'layers' as const, route: '/(student)/flashcards' },
];

const MILESTONES = [
  { id: '1', title: 'Complete Mechanics module', due: 'Mon', done: true },
  { id: '2', title: 'Solve 20 Organic problems', due: 'Wed', done: false },
  { id: '3', title: 'Watch Thermodynamics lectures', due: 'Thu', done: false },
  { id: '4', title: 'Mock Test — Physics', due: 'Sat', done: false },
];

export default function HomeScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();

  const today = new Date();
  const dateString = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
    },
    date: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      marginTop: 24,
    },
    focusCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
    },
    focusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    focusItemBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    focusText: {
      fontSize: 15,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    focusTextDone: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
      marginTop: 16,
    },
    progressCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 6,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    progressText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    progressLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 10,
    },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickTile: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
      marginBottom: 12,
    },
    quickIcon: {
      marginBottom: 8,
    },
    quickLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    milestoneItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    milestoneText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      marginLeft: 12,
    },
    milestoneTextDone: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    milestoneDue: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.greeting}>Hello, Arjun</Text>
        <Text style={styles.date}>{dateString}</Text>

        {/* Today's Focus */}
        <Text style={styles.sectionTitle}>Today's Focus</Text>
        <View style={styles.focusCard}>
          {FOCUS_TOPICS.map((item, index) => (
            <View
              key={item.id}
              style={[styles.focusItem, index > 0 && styles.focusItemBorder]}
            >
              <Ionicons
                name={item.done ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.done ? colors.success : colors.textSecondary}
              />
              <Text style={[styles.focusText, item.done && styles.focusTextDone]}>
                {item.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>65%</Text>
          </View>
          <Text style={styles.progressLabel}>Overall Progress</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickTile}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={action.icon}
                size={28}
                color={colors.primary}
                style={styles.quickIcon}
              />
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Study Plan */}
        <Text style={styles.sectionTitle}>This Week's Plan</Text>
        {MILESTONES.map((item) => (
          <View key={item.id} style={styles.milestoneItem}>
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={item.done ? colors.success : colors.textSecondary}
            />
            <Text style={[styles.milestoneText, item.done && styles.milestoneTextDone]}>
              {item.title}
            </Text>
            <Text style={styles.milestoneDue}>{item.due}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
