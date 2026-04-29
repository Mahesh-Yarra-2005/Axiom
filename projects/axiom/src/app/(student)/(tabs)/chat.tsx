import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface Conversation {
  id: number;
  title: string | null;
  summary_text: string | null;
  created_at: string;
  updated_at: string;
}

export default function ChatScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchStudentId();
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (studentId) {
        fetchConversations();
      }
    }, [studentId])
  );

  const fetchStudentId = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    if (error) {
      setError('Failed to load student profile');
      setLoading(false);
      return;
    }
    setStudentId(data.id);
  };

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('student_id', studentId!)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Failed to load conversations');
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };

  const handleNewChat = async () => {
    if (!studentId) return;

    const { data, error: insertError } = await supabase
      .from('conversations')
      .insert({ student_id: studentId, title: 'New Conversation' })
      .select()
      .single();

    if (insertError || !data) {
      setError('Failed to create conversation');
      return;
    }

    router.push(`/(student)/chat/${data.id}` as any);
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    listContent: {
      padding: 20,
      paddingTop: 8,
    },
    conversationCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    conversationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    conversationPreview: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    conversationTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      opacity: 0.7,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 22,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 14,
      color: colors.error || '#E74C3C',
      textAlign: 'center',
      padding: 20,
    },
  });

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => router.push(`/(student)/chat/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <Text style={styles.conversationTitle}>{item.title || 'Untitled Conversation'}</Text>
      {item.summary_text && (
        <Text style={styles.conversationPreview} numberOfLines={2}>
          {item.summary_text}
        </Text>
      )}
      <Text style={styles.conversationTime}>{formatTimestamp(item.updated_at || item.created_at)}</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        Start your first conversation with Axiom AI
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Conversations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={conversations.length === 0 ? { flex: 1 } : styles.listContent}
        ListEmptyComponent={renderEmpty}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewChat}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
