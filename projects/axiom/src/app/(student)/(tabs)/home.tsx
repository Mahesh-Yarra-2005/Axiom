import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { BloomLevels } from '@/constants/blooms';

interface Weakness {
  topic: string;
  subject: string | null;
  hit_count: number;
}

interface BloomsDistribution {
  level: string;
  count: number;
}

function getCognitiveTip(distribution: BloomsDistribution[]): string {
  if (distribution.length === 0) return '';
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return '';
  const levelWeights: Record<string, number> = {
    Remember: 1, Understand: 2, Apply: 3, Analyze: 4, Evaluate: 5, Create: 6,
  };
  const weightedSum = distribution.reduce((sum, d) => sum + (levelWeights[d.level] ?? 3) * d.count, 0);
  const avgWeight = weightedSum / total;
  if (avgWeight <= 2.5) return "Try asking 'Why does X happen?' or 'Compare X and Y' to go deeper";
  if (avgWeight <= 4.5) return 'Great analytical thinking! Try evaluating trade-offs next';
  return 'Excellent higher-order thinking!';
}

interface BroadcastNotification {
  id: number;
  broadcast_id: number;
  student_id: number;
  adjustment_note: string | null;
  seen: boolean;
  created_at: string;
  teacher_broadcasts: {
    id: number;
    title: string;
    subject: string | null;
    chapter: string | null;
    event_date: string;
    event_type: string;
  } | null;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function eventTypeColor(type: string): string {
  switch (type) {
    case 'test': return '#EF4444';
    case 'assignment': return '#F97316';
    case 'revision': return '#3B82F6';
    case 'announcement': return '#22C55E';
    default: return '#888';
  }
}

function daysUntil(isoDate: string): number {

  const handleDismissNotification = async (adjustmentId: number) => {
    if (dismissingIds.has(adjustmentId)) return;

    setDismissingIds(prev => new Set(prev).add(adjustmentId));

    try {
      const { error } = await supabase
        .from('broadcast_adjustments')
        .update({ seen: true })
        .eq('id', adjustmentId);

      if (error) {
        console.error('Error dismissing notification:', error.message);
        return;
      }

      setNotifications(prev => prev.filter(n => n.id !== adjustmentId));
      setUnseenCount(prev => Math.max(0, prev - 1));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      console.error('handleDismissNotification error:', msg);
    } finally {
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(adjustmentId);
        return next;
      });
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatEventDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}


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
  const { user, profile } = useAuthStore();
  const router = useRouter();

  const [milestones, setMilestones] = useState(MILESTONES);
  const [progressPct, setProgressPct] = useState(0);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [weaknessLoading, setWeaknessLoading] = useState(true);
  const [bloomsDistribution, setBloomsDistribution] = useState<BloomsDistribution[]>([]);
  const [bloomsLoading, setBloomsLoading] = useState(true);

  // Broadcast notifications state
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [dismissingIds, setDismissingIds] = useState<Set<number>>(new Set());
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const firstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Student';


  const fetchBroadcastNotifications = useCallback(async (studentId: number) => {
    try {
      const { data: adjRows, error: adjErr } = await supabase
        .from('broadcast_adjustments')
        .select(`
          id,
          broadcast_id,
          student_id,
          adjustment_note,
          seen,
          created_at,
          teacher_broadcasts (
            id,
            title,
            subject,
            chapter,
            event_date,
            event_type
          )
        `)
        .eq('student_id', studentId)
        .eq('seen', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (adjErr) {
        console.error('Error fetching broadcast notifications:', adjErr.message);
        return;
      }

      const rows = (adjRows ?? []) as BroadcastNotification[];
      setNotifications(rows);
      setUnseenCount(rows.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('fetchBroadcastNotifications error:', msg);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch student record once and use for all queries
    supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()
      .then(({ data: student }) => {
        if (!student) return;

        // Fetch active study plan milestones
        supabase
          .from('study_plans')
          .select('milestones')
          .eq('student_id', student.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data: plan }) => {
            if (plan?.milestones && Array.isArray(plan.milestones) && plan.milestones.length > 0) {
              setMilestones(plan.milestones);
            }
          });

        // Fetch progress from study_goals
        supabase
          .from('study_goals')
          .select('progress_pct')
          .eq('student_id', student.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data: goal }) => {
            if (goal?.progress_pct != null) {
              setProgressPct(Math.round(goal.progress_pct));
            }
          });

        // Fetch top 3 weakness topics
        supabase
          .from('weakness_tracking')
          .select('topic, subject, hit_count')
          .eq('student_id', student.id)
          .order('hit_count', { ascending: false })
          .limit(3)
          .then(({ data, error }) => {
            if (!error && data) {
              setWeaknesses(data as Weakness[]);
            }
            setWeaknessLoading(false);
          });

        // Fetch Bloom's distribution for the past 7 days
        fetchBloomsDistribution(student.id);

        // Fetch broadcast notifications from teachers
        fetchBroadcastNotifications(student.id);
      });
  }, [user?.id, fetchBroadcastNotifications]);

  async function fetchBloomsDistribution(studentId: number) {
    try {
      setBloomsLoading(true);

      // Get conversation IDs for this student
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('student_id', studentId);

      if (convError) {
        console.error('Failed to fetch conversations for Bloom\'s chart:', convError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        setBloomsDistribution([]);
        return;
      }

      const conversationIds = conversations.map((c: { id: number }) => c.id);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('blooms_level')
        .in('conversation_id', conversationIds)
        .not('blooms_level', 'is', null)
        .gte('created_at', sevenDaysAgo);

      if (msgsError) {
        console.error("Failed to fetch Bloom's messages:", msgsError);
        return;
      }

      if (!msgs || msgs.length === 0) {
        setBloomsDistribution([]);
        return;
      }

      // Count by level
      const countMap: Record<string, number> = {};
      for (const msg of msgs) {
        if (msg.blooms_level) {
          countMap[msg.blooms_level] = (countMap[msg.blooms_level] ?? 0) + 1;
        }
      }

      // Only include levels that have data
      const distribution: BloomsDistribution[] = BloomLevels
        .map(bl => ({ level: bl.name, count: countMap[bl.name] ?? 0 }))
        .filter(d => d.count > 0);

      setBloomsDistribution(distribution);
    } catch (err) {
      console.error("Bloom's distribution fetch error:", err);
    } finally {
      setBloomsLoading(false);
    }
  }

  const today = new Date();
  const dateString = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const getWeaknessDotColor = (hitCount: number): string => {
    if (hitCount >= 3) return colors.warning ?? '#F59E0B';
    if (hitCount === 2) return '#FBBF24';
    return colors.textSecondary;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginTop: 12,
      marginBottom: 24,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    date: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '22',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      gap: 6,
      marginTop: 4,
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
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
    // Weakness card styles
    weaknessCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
    },
    weaknessCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    weaknessCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    weaknessItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    weaknessItemBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    weaknessDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    weaknessTopicText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    subjectBadge: {
      backgroundColor: colors.card,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginRight: 8,
    },
    subjectBadgeText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    askAiButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    askAiButtonText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    weaknessEmptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 12,
    },
    weaknessSkeletonLine: {
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    // Broadcast notification styles
    loadingRow: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    notifCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notifCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    eventBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    eventBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    countdownPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    countdownText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    notifTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    notifMeta: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    tipBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: colors.primary + '14',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
    },
    tipText: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
      lineHeight: 18,
    },
    dismissButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dismissButtonDisabled: {
      opacity: 0.5,
    },
    dismissText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 4,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    // Cognitive Balance Chart styles
    cognitiveCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
    },
    cognitiveHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    cognitiveTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    emptyBloomsText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 12,
    },
    bloomsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    bloomsLabel: {
      fontSize: 12,
      fontWeight: '600',
      width: 68,
    },
    bloomsBarTrack: {
      flex: 1,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    bloomsBarFill: {
      height: 10,
      borderRadius: 5,
    },
    bloomsCount: {
      fontSize: 12,
      fontWeight: '700',
      width: 24,
      textAlign: 'right',
      color: colors.textSecondary,
    },
    cognitiveTipBox: {
      marginTop: 14,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.card,
    },
    cognitiveTipText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    cognitiveTipBold: {
      fontWeight: '700',
      color: colors.text,
    },
  });

  const displayedNotifications = showAllNotifications
    ? notifications
    : notifications.slice(0, 3);

    const maxBloomsCount = bloomsDistribution.length > 0
    ? Math.max(...bloomsDistribution.map(d => d.count))
    : 0;

  const cognitiveTip = getCognitiveTip(bloomsDistribution);

  const renderCognitiveBalance = () => {
    return (
      <View style={styles.cognitiveCard}>
        <View style={styles.cognitiveHeader}>
          <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
          <Text style={styles.cognitiveTitle}>Cognitive Balance</Text>
        </View>

        {bloomsLoading ? (
          <Text style={styles.emptyBloomsText}>Loading...</Text>
        ) : bloomsDistribution.length === 0 ? (
          <Text style={styles.emptyBloomsText}>
            Start chatting to see your thinking depth
          </Text>
        ) : (
          <>
            {BloomLevels.map((bl) => {
              const entry = bloomsDistribution.find(d => d.level === bl.name);
              const count = entry?.count ?? 0;
              if (count === 0) return null;
              const barWidthPct = maxBloomsCount > 0 ? (count / maxBloomsCount) * 100 : 0;
              return (
                <View key={bl.level} style={styles.bloomsRow}>
                  <Text style={[styles.bloomsLabel, { color: bl.color }]}>{bl.name}</Text>
                  <View style={styles.bloomsBarTrack}>
                    <View
                      style={[
                        styles.bloomsBarFill,
                        { width: `${barWidthPct}%` as any, backgroundColor: bl.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.bloomsCount}>{count}</Text>
                </View>
              );
            })}
            {cognitiveTip ? (
              <View style={styles.cognitiveTipBox}>
                <Text style={styles.cognitiveTipText}>
                  <Text style={styles.cognitiveTipBold}>Tip: </Text>
                  {cognitiveTip}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>
    );
  };

  const renderWeaknessCard = () => {
    return (
      <View style={styles.weaknessCard}>
        <View style={styles.weaknessCardHeader}>
          <Ionicons name="warning" size={20} color={colors.warning ?? '#F59E0B'} />
          <Text style={styles.weaknessCardTitle}>AI-Detected Weak Areas</Text>
        </View>

        {weaknessLoading ? (
          <>
            <View style={[styles.weaknessSkeletonLine, { width: '80%' }]} />
            <View style={[styles.weaknessSkeletonLine, { width: '65%' }]} />
            <View style={[styles.weaknessSkeletonLine, { width: '72%', marginBottom: 0 }]} />
          </>
        ) : weaknesses.length === 0 ? (
          <Text style={styles.weaknessEmptyText}>
            Chat more to detect your weak areas
          </Text>
        ) : (
          weaknesses.map((item, index) => (
            <View
              key={`${item.topic}-${index}`}
              style={[styles.weaknessItem, index > 0 && styles.weaknessItemBorder]}
            >
              <View
                style={[
                  styles.weaknessDot,
                  { backgroundColor: getWeaknessDotColor(item.hit_count) },
                ]}
              />
              <Text style={styles.weaknessTopicText} numberOfLines={1}>
                {item.topic}
              </Text>
              {item.subject ? (
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{item.subject}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.askAiButton}
                onPress={() =>
                  router.push({
                    pathname: '/(student)/(tabs)/chat',
                    params: { topic: item.topic },
                  } as any)
                }
                activeOpacity={0.7}
              >
                <Text style={styles.askAiButtonText}>Ask AI →</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with badge */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>
          {unseenCount > 0 && (
            <View style={styles.badgeContainer}>
              <View style={styles.pulseDot} />
              <Text style={styles.badgeText}>{unseenCount}</Text>
            </View>
          )}
        </View>

        {/* From Your Teachers (broadcast notifications) */}
        {(loadingNotifications || notifications.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>From Your Teachers</Text>
            {loadingNotifications ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <>
                {displayedNotifications.map((notif) => {
                  const bc = notif.teacher_broadcasts;
                  if (!bc) return null;
                  const days = daysUntil(bc.event_date);
                  const typeColor = eventTypeColor(bc.event_type);
                  const isDismissing = dismissingIds.has(notif.id);

                  return (
                    <View
                      key={notif.id}
                      style={[styles.notifCard, { borderLeftColor: typeColor, borderLeftWidth: 4 }]}
                    >
                      <View style={styles.notifCardTop}>
                        <View style={[styles.eventBadge, { backgroundColor: typeColor + '22', borderColor: typeColor }]}>
                          <Text style={[styles.eventBadgeText, { color: typeColor }]}>
                            {bc.event_type.charAt(0).toUpperCase() + bc.event_type.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.countdownPill}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={days <= 3 ? colors.warning : colors.textSecondary}
                          />
                          <Text style={[styles.countdownText, days <= 3 && { color: colors.warning }]}>
                            {days === 0 ? 'Today' : days < 0 ? 'Past' : `in ${days} day${days !== 1 ? 's' : ''}`}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.notifTitle}>{bc.title}</Text>

                      {(bc.subject || bc.chapter) && (
                        <Text style={styles.notifMeta}>
                          {[bc.subject, bc.chapter ? `Ch. ${bc.chapter}` : null].filter(Boolean).join(' · ')}
                          {' · '}{formatEventDate(bc.event_date)}
                        </Text>
                      )}

                      {notif.adjustment_note ? (
                        <View style={styles.tipBox}>
                          <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                          <Text style={styles.tipText}>{notif.adjustment_note}</Text>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        style={[styles.dismissButton, isDismissing && styles.dismissButtonDisabled]}
                        onPress={() => handleDismissNotification(notif.id)}
                        disabled={isDismissing}
                        activeOpacity={0.7}
                      >
                        {isDismissing ? (
                          <ActivityIndicator size="small" color={colors.textSecondary} />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={15} color={colors.textSecondary} />
                            <Text style={styles.dismissText}>Dismiss</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {notifications.length > 3 && !showAllNotifications && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => setShowAllNotifications(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllText}>See all {notifications.length} notifications</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}

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

        {/* AI-Detected Weak Areas */}
        <Text style={styles.sectionTitle}>Focus Areas</Text>
        {renderWeaknessCard()}

        {/* Cognitive Balance Chart */}
        <Text style={styles.sectionTitle}>Thinking Depth This Week</Text>
        {renderCognitiveBalance()}

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>{progressPct}%</Text>
          </View>
          <Text style={styles.progressLabel}>
            {progressPct > 0 ? 'Overall Progress' : 'Start studying to track progress'}
          </Text>
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
        {milestones.map((item: any) => (
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
