import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
// Clipboard not installed; use Alert to show code

export default function ProfileScreen() {
  const { colors, scheme, toggleTheme } = useThemeStore();
  const { user, profile, reset } = useAuthStore();
  const router = useRouter();
  const [devOptionsExpanded, setDevOptionsExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [studentData, setStudentData] = useState<{
    exam_type: string | null;
    target_date: string | null;
    invite_code: string | null;
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('students')
        .select('exam_type, target_date, invite_code')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setStudentData(data);
        });
    }
  }, [user?.id]);

  const fullName = profile?.full_name || user?.email?.split('@')[0] || 'Student';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const email = user?.email || '';
  const examLabel = studentData?.exam_type
    ? `Target: ${studentData.exam_type}${studentData.target_date ? ` ${new Date(studentData.target_date).getFullYear()}` : ''}`
    : null;
  const inviteCode = studentData?.invite_code || '------';

  const handleCopyCode = async () => {
    Alert.alert('Invite Code', inviteCode);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    reset();
    router.replace('/');
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
    avatarContainer: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 24,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
      color: '#000',
    },
    userName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    userExam: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 6,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
    inviteCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    inviteCode: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 3,
    },
    inviteLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    copyButton: {
      backgroundColor: colors.primaryMuted,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    copyButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    settingsItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    settingsItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingsItemText: {
      fontSize: 15,
      color: colors.text,
      marginLeft: 12,
    },
    devSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    devHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    devHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    devHeaderText: {
      fontSize: 15,
      color: colors.text,
      marginLeft: 12,
    },
    devInput: {
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    signOutButton: {
      marginTop: 24,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    signOutText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.error,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar & Info */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          {examLabel && <Text style={styles.userExam}>{examLabel}</Text>}
        </View>

        {/* Invite Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Code</Text>
          <View style={styles.inviteCard}>
            <View>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
              <Text style={styles.inviteLabel}>Share with your parent to link accounts</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name={scheme === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.settingsItemText}>
                {scheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={scheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={colors.primary}
            />
          </View>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => router.push('/(student)/goals' as any)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="flag" size={20} color={colors.primary} />
              <Text style={styles.settingsItemText}>My Goals</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => router.push('/(student)/flashcards' as any)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="layers" size={20} color={colors.primary} />
              <Text style={styles.settingsItemText}>Flashcards</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => router.push('/(student)/videos' as any)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="play-circle" size={20} color={colors.primary} />
              <Text style={styles.settingsItemText}>Video Hub</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Developer Options */}
          <View style={styles.devSection}>
            <TouchableOpacity
              style={styles.devHeader}
              onPress={() => setDevOptionsExpanded(!devOptionsExpanded)}
            >
              <View style={styles.devHeaderLeft}>
                <Ionicons name="code-slash" size={20} color={colors.primary} />
                <Text style={styles.devHeaderText}>Developer Options</Text>
              </View>
              <Ionicons
                name={devOptionsExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {devOptionsExpanded && (
              <TextInput
                style={styles.devInput}
                placeholder="Enter API key..."
                placeholderTextColor={colors.textSecondary}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
            )}
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
