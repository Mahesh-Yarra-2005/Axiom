import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const SAMPLE_NOTE = {
  id: '1',
  title: 'Newton\'s Laws of Motion',
  subject: 'Physics',
  chapter: 'Mechanics',
  source: 'Chat Export',
  createdAt: '2025-01-15',
  content: `# Newton's Laws of Motion

## First Law (Law of Inertia)
An object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction, unless acted upon by an unbalanced force.

**Key Points:**
- Inertia is the tendency of an object to resist changes in its state of motion
- Mass is a measure of inertia
- The greater the mass, the greater the inertia

## Second Law (F = ma)
The acceleration of an object depends on the net force acting on it and the mass of the object.

**Formula:** F = ma
- F = Force (Newtons)
- m = mass (kg)
- a = acceleration (m/s²)

## Third Law (Action-Reaction)
For every action, there is an equal and opposite reaction.

**Examples:**
- Walking: foot pushes ground backward, ground pushes foot forward
- Rocket propulsion: exhaust gases push downward, rocket moves upward
- Swimming: hands push water backward, body moves forward

## Important Formulas
- Momentum: p = mv
- Impulse: J = FΔt = Δp
- Weight: W = mg (g = 9.8 m/s²)`,
};

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

export default function NoteDetail() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const note = SAMPLE_NOTE;
  const styles = makeStyles(colors);

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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{note.subject}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{note.chapter}</Text>
          </View>
          <View style={[styles.badge, styles.sourceBadge]}>
            <Ionicons name="document-text-outline" size={12} color={colors.primary} />
            <Text style={[styles.badgeText, { marginLeft: 4 }]}>{note.source}</Text>
          </View>
        </View>

        <Text style={styles.date}>Created: {note.createdAt}</Text>

        <View style={styles.contentSection}>
          {renderFormattedText(note.content, colors)}
        </View>

        <TouchableOpacity style={styles.deleteButton}>
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
