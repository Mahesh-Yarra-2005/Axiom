import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const FILTERS = ['All', 'Physics', 'Chemistry', 'Math', 'Biology'];

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#4A90D9',
  Chemistry: '#E67E22',
  Math: '#27AE60',
  Mathematics: '#27AE60',
  Biology: '#8E44AD',
};

interface Note {
  id: number;
  title: string;
  subject: string | null;
  chapter: string | null;
  content_json: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function NotesScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isGridView, setIsGridView] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
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
        fetchNotes();
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

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('student_id', studentId!)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Failed to load notes');
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesFilter =
      activeFilter === 'All' || note.subject === activeFilter;
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    viewToggle: {
      padding: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginTop: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      marginLeft: 8,
      fontSize: 15,
      color: colors.text,
    },
    filtersContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: colors.primary,
    },
    listContent: {
      padding: 20,
      paddingTop: 4,
    },
    gridContent: {
      padding: 20,
      paddingTop: 4,
    },
    gridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    noteCardList: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    noteCardGrid: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      width: '48%',
      marginBottom: 12,
    },
    noteTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    noteSubjectBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginBottom: 8,
    },
    noteSubjectText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
    },
    noteDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    notePreview: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 22,
    },
    errorText: {
      fontSize: 14,
      color: colors.error || '#E74C3C',
      textAlign: 'center',
      padding: 20,
    },
  });

  const renderNoteCard = (note: Note, isGrid: boolean) => (
    <TouchableOpacity
      key={note.id.toString()}
      style={isGrid ? styles.noteCardGrid : styles.noteCardList}
      onPress={() => router.push(`/(student)/notes/${note.id}` as any)}
      activeOpacity={0.7}
    >
      {note.subject && (
        <View
          style={[
            styles.noteSubjectBadge,
            { backgroundColor: SUBJECT_COLORS[note.subject] || colors.primary },
          ]}
        >
          <Text style={styles.noteSubjectText}>{note.subject}</Text>
        </View>
      )}
      <Text style={styles.noteTitle} numberOfLines={2}>
        {note.title}
      </Text>
      <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
      {note.content_json && (
        <Text style={styles.notePreview} numberOfLines={2}>
          {note.content_json.substring(0, 120)}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        No notes yet. Create your first note!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>My Notes</Text>
          </View>
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
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Notes</Text>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setIsGridView(!isGridView)}
          >
            <Ionicons
              name={isGridView ? 'list' : 'grid'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredNotes.length === 0 ? (
        renderEmpty()
      ) : (
        <ScrollView contentContainerStyle={isGridView ? styles.gridContent : styles.listContent}>
          {isGridView ? (
            <View style={styles.gridRow}>
              <View style={{ width: '48%' }}>
                {filteredNotes
                  .filter((_, i) => i % 2 === 0)
                  .map((note) => renderNoteCard(note, true))}
              </View>
              <View style={{ width: '48%' }}>
                {filteredNotes
                  .filter((_, i) => i % 2 === 1)
                  .map((note) => renderNoteCard(note, true))}
              </View>
            </View>
          ) : (
            filteredNotes.map((note) => renderNoteCard(note, false))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(student)/notes/create' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
