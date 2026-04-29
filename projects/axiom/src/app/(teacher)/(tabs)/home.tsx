import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

export default function TeacherHomeScreen() {
  const { colors } = useThemeStore();
  const { user, profile } = useAuthStore();
  const router = useRouter();

  const firstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Teacher';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginTop: 12,
      marginBottom: 24,
    },
    brandText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 6,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 28,
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },
    actionCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    actionIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    actionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    actionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.brandText}>AXIOM</Text>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Notes Shared</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Chats Today</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert('Coming soon')}
          activeOpacity={0.7}
        >
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="document-text" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Share Study Notes</Text>
              <Text style={styles.actionSubtitle}>Upload and share with your class</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert('Coming soon')}
          activeOpacity={0.7}
        >
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="help-circle" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Assign Practice Quiz</Text>
              <Text style={styles.actionSubtitle}>Create quizzes for your students</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(teacher)/(tabs)/students' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="bar-chart" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>View Student Progress</Text>
              <Text style={styles.actionSubtitle}>Track how your students are doing</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No activity yet. Invite students to get started.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
