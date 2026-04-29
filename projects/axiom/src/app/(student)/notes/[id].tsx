import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';

interface NoteData {
  id: number;
  title: string;
  subject: string | null;
  chapter: string | null;
  content_json: string | null;
  source_type: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

function renderFormattedText(content: string, colors: any) {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('# ')) {
      return (
        <Text key={index} style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 }}>
          {line.replace('# ', '')}
        </Text>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <Text key={index} style={{ fontSize: 18, fontWeight: '600', color: colors.primary, marginTop: 14, marginBottom: 6 }}>
          {line.replace('## ', '')}
        </Text>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <View key={index} style={{ flexDirection: 'row', marginLeft: 12, marginBottom: 4 }}>
          <Text style={{ color: colors.primary, marginRight: 8 }}>{'\u2022'}</Text>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22, flex: 1 }}>
            {line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '$1')}
          </Text>
        </View>
      );
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <Text key={index} style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 8, marginBottom: 4 }}>
          {line.replace(/\*\*/g, '')}
        </Text>
      );
    }
    if (line.trim() === '') {
      return <View key={index} style={{ height: 8 }} />;
    }
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '$1');
    return (
      <Text key={index} style={{ fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 2 }}>
        {formatted}
      </Text>
    );
  });
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  chat_export: 'Chat Export',
  video_summary: 'Video Summary',
};

export default function NoteDetail() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      setError('Failed to load note');
    } else {
      setNote(data);
    }
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('notes').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', 'Failed to delete note');
            return;
          }
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !note) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: colors.error || '#E74C3C', fontSize: 16, textAlign: 'center' }}>
            {error || 'Note not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {note.title}
        </Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.badges}>
          {note.subject && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{note.subject}</Text>
            </View>
          )}
          {note.chapter && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{note.chapter}</Text>
            </View>
          )}
          {note.source_type && (
            <View style={[styles.badge, styles.sourceBadge]}>
              <Ionicons name="document-text-outline" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { marginLeft: 4 }]}>
                {SOURCE_LABELS[note.source_type] || note.source_type}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.date}>
          Created: {new Date(note.created_at).toLocaleDateString()}
        </Text>

        <View style={styles.contentSection}>
          {note.content_json
            ? renderFormattedText(note.content_json, colors)
            : <Text style={{ color: colors.textSecondary }}>No content</Text>
          }
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteText}>Delete Note</Text>
        </TouchableOpacity>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    editButton: {
      padding: 4,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    sourceBadge: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.primary,
    },
    date: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    contentSection: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error + '30',
    },
    deleteText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.error,
      marginLeft: 8,
    },
  });
