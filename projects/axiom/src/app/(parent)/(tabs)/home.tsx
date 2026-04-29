import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

interface ChildData {
  id: string;
  name: string;
  initials: string;
  studyHours: number;
  progress: number;
  lastActive: string;
  status: string;
  statusColor: string;
}

export default function ParentHome() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  const styles = makeStyles(colors);

  const fetchChildren = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Get parent record
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (parentError || !parent) {
        setLoading(false);
        return;
      }

      // Get linked students with user info
      const { data: links, error: linksError } = await supabase
        .from('parent_student_links')
        .select(`
          student_id,
          students (
            id,
            exam_type,
            target_date,
            user_id,
            users (
              full_name,
              email
            )
          )
        `)
        .eq('parent_id', parent.id);

      if (linksError || !links) {
        setLoading(false);
        return;
      }

      // For each child, fetch recent daily_progress (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const childrenData: ChildData[] = await Promise.all(
        links.map(async (link: any) => {
          const student = link.students;
          const userInfo = student?.users;
          const studentId = student?.id;
          const name = userInfo?.full_name || userInfo?.email || 'Unknown';
          const initials = name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          // Fetch daily progress for last 7 days
          const { data: progress } = await supabase
            .from('daily_progress')
            .select('study_minutes, quiz_score, date')
            .eq('student_id', studentId)
            .gte('date', dateStr)
            .order('date', { ascending: false });

          const totalMinutes = (progress || []).reduce(
            (sum: number, p: any) => sum + (p.study_minutes || 0),
            0
          );
          const studyHours = Math.round((totalMinutes / 60) * 10) / 10;

          // Fetch overall progress from study_goals
          const { data: goals } = await supabase
            .from('study_goals')
            .select('progress_pct')
            .eq('student_id', studentId);

          const avgProgress = goals && goals.length > 0
            ? Math.round(goals.reduce((sum: number, g: any) => sum + (g.progress_pct || 0), 0) / goals.length)
            : 0;

          // Determine last active from most recent progress entry
          let lastActive = 'No data';
          if (progress && progress.length > 0) {
            const lastDate = new Date(progress[0].date);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) lastActive = 'Today';
            else if (diffDays === 1) lastActive = 'Yesterday';
            else lastActive = `${diffDays} days ago`;
          }

          // Status logic
          const status = studyHours >= 7 ? 'On Track' : 'Needs Attention';
          const statusColor = studyHours >= 7 ? 'success' : 'warning';

          return {
            id: String(studentId),
            name,
            initials,
            studyHours,
            progress: avgProgress,
            lastActive,
            status,
            statusColor,
          };
        })
      );

      setChildren(childrenData);
    } catch (err) {
      console.error('Error fetching children:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleLinkChild = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code || !user?.id) return;

    setLinking(true);
    try {
      // Get parent record
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (parentError || !parent) {
        Alert.alert('Error', 'Parent profile not found.');
        setLinking(false);
        return;
      }

      // Find student by invite code
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('invite_code', code)
        .single();

      if (studentError || !student) {
        Alert.alert('Invalid Code', 'No student found with that invite code.');
        setLinking(false);
        return;
      }

      // Check if link already exists
      const { data: existing } = await supabase
        .from('parent_student_links')
        .select('id')
        .eq('parent_id', parent.id)
        .eq('student_id', student.id)
        .single();

      if (existing) {
        Alert.alert('Already Linked', 'This child is already linked to your account.');
        setLinking(false);
        return;
      }

      // Create link
      const { error: insertError } = await supabase
        .from('parent_student_links')
        .insert({ parent_id: parent.id, student_id: student.id });

      if (insertError) {
        Alert.alert('Error', 'Failed to link child. Please try again.');
        setLinking(false);
        return;
      }

      setInviteCode('');
      setShowLinkInput(false);
      await fetchChildren();
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.progressText, { marginTop: 12 }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Parent Dashboard</Text>

        {children.length === 0 && !showLinkInput && (
          <View style={[styles.childCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.childName, { marginTop: 12, textAlign: 'center' }]}>
              No children linked yet
            </Text>
            <Text style={[styles.lastActive, { textAlign: 'center', marginTop: 4 }]}>
              Use an invite code to link your child's account
            </Text>
          </View>
        )}

        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={styles.childCard}
            onPress={() => router.push(`/(parent)/child/${child.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{child.initials}</Text>
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.lastActive}>Last active: {child.lastActive}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      child.statusColor === 'success'
                        ? colors.success + '20'
                        : colors.warning + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        child.statusColor === 'success' ? colors.success : colors.warning,
                    },
                  ]}
                >
                  {child.status}
                </Text>
              </View>
            </View>

            <Text style={styles.studyHours}>
              Study hours this week: {child.studyHours}h
            </Text>

            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${child.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{child.progress}% overall progress</Text>
          </TouchableOpacity>
        ))}

        {showLinkInput ? (
          <View style={styles.linkSection}>
            <Text style={styles.linkTitle}>Enter Invite Code</Text>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Enter child's invite code"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.linkButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLinkInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkButton, { opacity: linking ? 0.6 : 1 }]}
                onPress={handleLinkChild}
                disabled={linking}
              >
                {linking ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.linkButtonText}>Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => setShowLinkInput(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addChildText}>Link Child</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 24,
      marginTop: 12,
    },
    childCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '30',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    cardHeaderInfo: {
      flex: 1,
      marginLeft: 12,
    },
    childName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    lastActive: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    studyHours: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
    },
    linkSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    linkTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    linkButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    cancelButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '500',
    },
    linkButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10,
    },
    linkButtonText: {
      color: '#000',
      fontSize: 15,
      fontWeight: '600',
    },
    addChildButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.primary + '50',
      borderStyle: 'dashed',
    },
    addChildText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
