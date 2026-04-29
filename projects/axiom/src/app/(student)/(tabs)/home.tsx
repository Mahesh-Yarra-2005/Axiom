import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore, xpProgressInLevel, levelTitle } from '@/stores/gamificationStore';
import { supabase } from '@/lib/supabase';

const QUICK_ACTIONS = [
  { id: 'chat', label: 'AI Tutor', icon: 'chatbubble-ellipses' as const, route: '/(student)/(tabs)/chat', color: '#2196F3' },
  { id: 'flashcards', label: 'Flashcards', icon: 'layers' as const, route: '/(student)/flashcards', color: '#FF9800' },
  { id: 'notes', label: 'My Notes', icon: 'document-text' as const, route: '/(student)/(tabs)/notes', color: '#4CAF50' },
  { id: 'videos', label: 'Video Hub', icon: 'play-circle' as const, route: '/(student)/videos', color: '#9C27B0' },
  { id: 'goals', label: 'Goals', icon: 'flag' as const, route: '/(student)/goals', color: '#EF4444' },
  { id: 'quiz', label: 'Quizzes', icon: 'help-circle' as const, route: '/(student)/quizzes', color: '#D4AF37' },
];

interface Nudge {
  id: string;
  type: string;
  title: string;
  message: string;
}

export default function HomeScreen() {
  const { colors } = useThemeStore();
  const { user, profile, studentId } = useAuthStore();
  const { totalXp, level, currentStreak, fetchGamificationData } = useGamificationStore();
  const router = useRouter();

  const [milestones, setMilestones] = useState<any[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dueCards, setDueCards] = useState(0);
  const [studyMinutesToday, setStudyMinutesToday] = useState(0);

  const firstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    if (!user?.id || !studentId) return;

    fetchGamificationData(studentId);

    // Fetch study plan milestones
    supabase
      .from('study_plans')
      .select('milestones')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data: plan }) => {
        if (plan?.milestones && Array.isArray(plan.milestones)) {
          setMilestones(plan.milestones.slice(0, 5));
        }
      });

    // Fetch due flashcards count
    supabase
      .from('flashcards')
      .select('id', { count: 'exact' })
      .eq('student_id', studentId)
      .lte('next_review', new Date().toISOString())
      .then(({ count }) => setDueCards(count || 0));

    // Fetch today's study minutes
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('daily_progress')
      .select('study_minutes')
      .eq('student_id', studentId)
      .eq('date', today)
      .single()
      .then(({ data }) => setStudyMinutesToday(data?.study_minutes || 0));

    // Fetch unread nudges
    supabase
      .from('ai_nudges')
      .select('id, nudge_type, title, message')
      .eq('student_id', studentId)
      .eq('is_read', false)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setNudges((data || []).map((n: any) => ({
          id: n.id,
          type: n.nudge_type,
          title: n.title,
          message: n.message,
        })));
      });
  }, [user?.id, studentId]);

  const dismissNudge = async (nudgeId: string) => {
    setNudges(nudges.filter(n => n.id !== nudgeId));
    await supabase.from('ai_nudges').update({ is_dismissed: true }).eq('id', nudgeId);
  };

  const xpProgress = xpProgressInLevel(totalXp);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date();
  const dateString = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with XP */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandText}>AXIOM</Text>
            <Text style={styles.greeting}>{greeting}, {firstName}</Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>
          <TouchableOpacity style={styles.xpBadge} onPress={() => router.push('/(student)/profile' as any)}>
            <Text style={styles.xpLevel}>Lvl {level}</Text>
            <Text style={styles.xpAmount}>{totalXp} XP</Text>
          </TouchableOpacity>
        </View>

        {/* Streak & Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={18} color={currentStreak > 0 ? '#FF9800' : colors.textSecondary} />
            <Text style={[styles.statText, currentStreak > 0 && { color: '#FF9800' }]}>
              {currentStreak}d streak
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time" size={18} color={colors.primary} />
            <Text style={styles.statText}>
              {studyMinutesToday >= 60 ? `${(studyMinutesToday / 60).toFixed(1)}h` : `${studyMinutesToday}m`} today
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="layers" size={18} color={dueCards > 0 ? '#EF4444' : '#4CAF50'} />
            <Text style={[styles.statText, dueCards > 0 && { color: '#EF4444' }]}>
              {dueCards} due
            </Text>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpProgressContainer}>
          <View style={styles.xpProgressBar}>
            <View style={[styles.xpProgressFill, { width: `${xpProgress.percentage}%` }]} />
          </View>
          <Text style={styles.xpProgressText}>
            {xpProgress.current}/{xpProgress.needed} XP to Level {level + 1} — {levelTitle(level)}
          </Text>
        </View>

        {/* AI Nudges */}
        {nudges.length > 0 && (
          <View style={styles.nudgesSection}>
            {nudges.map((nudge) => (
              <View key={nudge.id} style={[styles.nudgeCard, getNudgeStyle(nudge.type, colors)]}>
                <View style={styles.nudgeContent}>
                  <Ionicons
                    name={getNudgeIcon(nudge.type)}
                    size={20}
                    color={getNudgeColor(nudge.type)}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.nudgeTitle}>{nudge.title}</Text>
                    <Text style={styles.nudgeMessage}>{nudge.message}</Text>
                  </View>
                  <TouchableOpacity onPress={() => dismissNudge(nudge.id)}>
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickTile}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIconContainer, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
              {action.id === 'flashcards' && dueCards > 0 && (
                <View style={styles.quickBadge}>
                  <Text style={styles.quickBadgeText}>{dueCards}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* This Week's Plan */}
        {milestones.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>This Week's Plan</Text>
            {milestones.map((item: any, i: number) => (
              <View key={item.id || i} style={styles.milestoneItem}>
                <TouchableOpacity>
                  <Ionicons
                    name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={item.done ? '#4CAF50' : colors.textSecondary}
                  />
                </TouchableOpacity>
                <Text style={[styles.milestoneText, item.done && styles.milestoneTextDone]}>
                  {item.title || item.theme || `Week ${item.week}`}
                </Text>
                {item.due && <Text style={styles.milestoneDue}>{item.due}</Text>}
              </View>
            ))}
          </>
        )}

        {/* Daily Challenge */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Ionicons name="trophy" size={20} color={colors.primary} />
            <Text style={styles.challengeTitle}>Daily Challenge</Text>
            <Text style={styles.challengeXP}>+100 XP</Text>
          </View>
          <Text style={styles.challengeDescription}>
            Review 10 flashcards and score 80%+ to earn today's bonus XP
          </Text>
          <TouchableOpacity
            style={styles.challengeButton}
            onPress={() => router.push('/(student)/flashcards' as any)}
          >
            <Text style={styles.challengeButtonText}>Start Challenge</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getNudgeIcon(type: string): any {
  const icons: Record<string, string> = {
    inactivity: 'time-outline',
    streak_at_risk: 'flame',
    review_due: 'layers-outline',
    struggle_detected: 'help-buoy',
    encouragement: 'star',
    study_suggestion: 'bulb',
    break_reminder: 'cafe',
  };
  return icons[type] || 'notifications';
}

function getNudgeColor(type: string): string {
  const colors: Record<string, string> = {
    inactivity: '#FF9800',
    streak_at_risk: '#EF4444',
    review_due: '#2196F3',
    struggle_detected: '#9C27B0',
    encouragement: '#4CAF50',
    study_suggestion: '#D4AF37',
    break_reminder: '#00BCD4',
  };
  return colors[type] || '#9E9E9E';
}

function getNudgeStyle(type: string, colors: any) {
  const color = getNudgeColor(type);
  return { borderLeftColor: color, borderLeftWidth: 3 };
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, marginBottom: 16 },
  brandText: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 2, marginBottom: 4 },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.text },
  date: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  xpBadge: { backgroundColor: colors.primary + '20', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '40' },
  xpLevel: { fontSize: 12, fontWeight: '700', color: colors.primary },
  xpAmount: { fontSize: 10, color: colors.textSecondary },

  statsStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statText: { fontSize: 12, fontWeight: '600', color: colors.text },
  statDivider: { width: 1, height: 20, backgroundColor: colors.border },

  xpProgressContainer: { marginBottom: 20 },
  xpProgressBar: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
  xpProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  xpProgressText: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

  nudgesSection: { marginBottom: 16 },
  nudgeCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  nudgeContent: { flexDirection: 'row', alignItems: 'flex-start' },
  nudgeTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  nudgeMessage: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 8 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickTile: { width: '31%', backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, position: 'relative' },
  quickIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  quickBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  quickBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFF' },

  milestoneItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  milestoneText: { fontSize: 14, color: colors.text, flex: 1, marginLeft: 12 },
  milestoneTextDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  milestoneDue: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  challengeCard: { backgroundColor: colors.primary + '10', borderRadius: 16, padding: 18, marginTop: 16, borderWidth: 1, borderColor: colors.primary + '30' },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  challengeTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  challengeXP: { fontSize: 12, fontWeight: '700', color: colors.primary },
  challengeDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  challengeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 10, padding: 10, gap: 6 },
  challengeButtonText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
});
