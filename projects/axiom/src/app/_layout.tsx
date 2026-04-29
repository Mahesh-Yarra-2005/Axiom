import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function RootLayout() {
  const { setSession, setRole, setProfile, setIsLoading, setIsOnboarded, isLoading } = useAuthStore();
  const { colors, scheme, loadSavedTheme } = useThemeStore();

  useEffect(() => {
    loadSavedTheme();
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (user) {
        setRole(user.role as any);
        setProfile(user);

        if (user.role === 'student') {
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .single();
          setIsOnboarded(!!student?.exam_type);
        } else {
          setIsOnboarded(true);
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: '#000' }]}>
        <Text style={styles.brandText}>Axiom</Text>
        <Text style={styles.brandTagline}>Your AI Study Companion</Text>
        <ActivityIndicator size="small" color="#D4AF37" style={{ marginTop: 24 }} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(parent)" />
      </Stack>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
