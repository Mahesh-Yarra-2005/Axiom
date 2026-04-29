import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Other'];

export default function CreateNote() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);

  const styles = makeStyles(colors);

  useEffect(() => {
    if (user?.id) {
      fetchStudentId();
    }
  }, [user?.id]);

  const fetchStudentId = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to load student profile');
      return;
    }
    setStudentId(data.id);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    if (!studentId) {
      Alert.alert('Error', 'Student profile not loaded');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('notes').insert({
      student_id: studentId,
      title: title.trim(),
      content_json: content.trim(),
      subject: selectedSubject || null,
      chapter: chapter.trim() || null,
      source_type: 'manual',
      tags: [],
    });

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
      return;
    }

    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Note</Text>
        <TouchableOpacity
          style={[styles.saveButton, { opacity: title.trim() && content.trim() && !saving ? 1 : 0.5 }]}
          onPress={handleSave}
          disabled={!title.trim() || !content.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Note title"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Subject</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
        >
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.chip,
                selectedSubject === subject && styles.chipSelected,
              ]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSubject === subject && styles.chipTextSelected,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Chapter</Text>
        <TextInput
          style={styles.input}
          value={chapter}
          onChangeText={setChapter}
          placeholder="e.g., Mechanics, Organic Chemistry"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Write your notes here... (supports # headers, **bold**, - bullet points)"
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
        />
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
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 8,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#000',
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    titleInput: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chipsScroll: {
      marginBottom: 20,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    chipSelected: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chipTextSelected: {
      color: colors.primary,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    contentInput: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 300,
      lineHeight: 24,
    },
  });
