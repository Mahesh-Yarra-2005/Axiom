import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const FILTERS = ['All', 'Physics', 'Chemistry', 'Math', 'Biology'];

const NOTES = [
  {
    id: '1',
    title: 'Newton\'s Laws of Motion',
    subject: 'Physics',
    date: 'Apr 28, 2026',
    preview: 'First law: An object remains at rest or in uniform motion unless acted upon by an external force...',
  },
  {
    id: '2',
    title: 'Organic Reaction Mechanisms',
    subject: 'Chemistry',
    date: 'Apr 26, 2026',
    preview: 'SN1 and SN2 reactions differ in their mechanism. SN1 proceeds through a carbocation intermediate...',
  },
  {
    id: '3',
    title: 'Integration Techniques',
    subject: 'Math',
    date: 'Apr 25, 2026',
    preview: 'Integration by parts: integral of u dv = uv - integral of v du. Choose u using LIATE rule...',
  },
  {
    id: '4',
    title: 'Cell Division — Mitosis & Meiosis',
    subject: 'Biology',
    date: 'Apr 23, 2026',
    preview: 'Mitosis produces two identical daughter cells. The process has four main phases: prophase...',
  },
  {
    id: '5',
    title: 'Thermodynamics First Law',
    subject: 'Physics',
    date: 'Apr 21, 2026',
    preview: 'The first law of thermodynamics states that energy cannot be created or destroyed, only transformed...',
  },
];

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#4A90D9',
  Chemistry: '#E67E22',
  Math: '#27AE60',
  Biology: '#8E44AD',
};

export default function NotesScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isGridView, setIsGridView] = useState(true);

  const filteredNotes = NOTES.filter((note) => {
    const matchesFilter = activeFilter === 'All' || note.subject === activeFilter;
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
  });

  const renderNoteCard = (note: typeof NOTES[0], isGrid: boolean) => (
    <TouchableOpacity
      key={note.id}
      style={isGrid ? styles.noteCardGrid : styles.noteCardList}
      onPress={() => router.push(`/(student)/notes/${note.id}` as any)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.noteSubjectBadge,
          { backgroundColor: SUBJECT_COLORS[note.subject] || colors.primary },
        ]}
      >
        <Text style={styles.noteSubjectText}>{note.subject}</Text>
      </View>
      <Text style={styles.noteTitle} numberOfLines={2}>
        {note.title}
      </Text>
      <Text style={styles.noteDate}>{note.date}</Text>
      <Text style={styles.notePreview} numberOfLines={2}>
        {note.preview}
      </Text>
    </TouchableOpacity>
  );

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
