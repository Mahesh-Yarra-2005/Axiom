import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export default function TeacherStudentsScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('users')
        .select('invite_code')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.invite_code) {
            setInviteCode(data.invite_code);
          }
        });
    }
  }, [user?.id]);

  const displayCode = inviteCode || '------';

  const handleCopyCode = () => {
    Alert.alert('Teacher Code', displayCode);
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
    header: {
      marginTop: 12,
      marginBottom: 28,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 40,
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    codeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    codeCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 16,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    codeValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 4,
    },
    copyButton: {
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    copyButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    codeHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 12,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>My Students</Text>
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No students linked yet.</Text>
          <Text style={styles.emptySubtext}>
            Students can link to you using your Teacher Code
          </Text>
        </View>

        {/* Teacher Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeCardTitle}>Your Teacher Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue}>{displayCode}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Text style={styles.copyButtonText}>Copy Code</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            Share this code with your students so they can link their accounts to your class.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
