import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const roles = [
  {
    key: 'student',
    title: 'Student',
    description: 'I want to study, take notes, and prepare for exams',
    icon: '📚',
  },
  {
    key: 'parent',
    title: 'Parent',
    description: "I want to monitor my child's study progress",
    icon: '👨‍👩‍👧',
  },
];

export default function RoleSelectScreen() {
  const { colors } = useThemeStore();
  const { user, session, setRole, setProfile } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    const currentUser = user ?? session?.user;
    if (!selectedRole) {
      Alert.alert('Select a role', 'Please choose Student or Parent to continue.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Session error', 'Please go back and log in again.');
      return;
    }

    setLoading(true);
    try {
      // Create user profile
      const { error: userError } = await supabase.from('users').upsert({
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || '',
        role: selectedRole,
      });

      if (userError) throw userError;

      // Create role-specific profile
      if (selectedRole === 'student') {
        await supabase.from('students').upsert({
          user_id: currentUser.id,
        });
      } else if (selectedRole === 'parent') {
        await supabase.from('parents').upsert({
          user_id: currentUser.id,
        });
      }

      setRole(selectedRole as any);
      setProfile({ id: currentUser.id, email: currentUser.email, role: selectedRole });

      if (selectedRole === 'student') {
        router.replace('/(student)/onboarding/syllabus');
      } else {
        router.replace('/(parent)/(tabs)/home');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to set up profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>I am a...</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose how you'll use Axiom
          </Text>
        </View>

        <View style={styles.options}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.roleCard,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedRole === role.key ? colors.primary : colors.border,
                  borderWidth: selectedRole === role.key ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.roleIcon}>{role.icon}</Text>
              <Text style={[styles.roleTitle, { color: colors.text }]}>{role.title}</Text>
              <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                {role.description}
              </Text>
              {selectedRole === role.key && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: selectedRole ? colors.primary : colors.surface,
              opacity: selectedRole ? 1 : 0.5,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.buttonText, { color: selectedRole ? '#000' : colors.textSecondary }]}>
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  options: {
    gap: 16,
    marginBottom: 40,
  },
  roleCard: {
    padding: 24,
    borderRadius: 16,
    position: 'relative',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
