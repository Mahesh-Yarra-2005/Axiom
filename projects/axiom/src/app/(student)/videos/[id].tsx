import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { callEdgeFunction } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function VideoDetail() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { id, title, channel, thumbnail } = useLocalSearchParams<{
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
  }>();
  const profile = useAuthStore((s) => s.profile);

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const styles = makeStyles(colors);

  const videoTitle = title || 'Video';
  const videoChannel = channel || '';

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const data = await callEdgeFunction('summarize-video', {
        video_id: id,
        video_title: videoTitle,
      });
      setSummary(data.summary || 'No summary available.');
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveAsNotes = async () => {
    if (!summary || !profile?.id) {
      Alert.alert('Error', 'No summary to save or user not found.');
      return;
    }
    setIsSaving(true);
    try {
      // Get student_id from profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (studentError || !student) {
        Alert.alert('Error', 'Could not find student profile.');
        return;
      }

      const { error } = await supabase.from('notes').insert({
        student_id: student.id,
        title: `Video Summary: ${videoTitle}`,
        content_json: summary,
        source_type: 'video_summary',
      });

      if (error) throw error;
      Alert.alert('Saved', 'Summary saved to your notes.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save notes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Video
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Video Player Placeholder */}
        <View style={styles.playerPlaceholder}>
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={48} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.videoTitle}>{videoTitle}</Text>
        <Text style={styles.videoChannel}>{videoChannel}</Text>

        {/* Summarize Button */}
        {!summary && !isSummarizing && (
          <TouchableOpacity
            style={styles.summarizeButton}
            onPress={handleSummarize}
          >
            <Ionicons name="sparkles" size={20} color="#000" />
            <Text style={styles.summarizeText}>Summarize</Text>
          </TouchableOpacity>
        )}

        {/* Loading state */}
        {isSummarizing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Generating summary...</Text>
          </View>
        )}

        {/* Error */}
        {summaryError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.error || '#e53e3e'} />
            <Text style={styles.errorText}>{summaryError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSummarize}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Section */}
        {summary && (
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.summaryTitle}>AI Summary</Text>
            </View>

            <Text style={styles.summaryBody}>{summary}</Text>

            {/* Save as Notes */}
            <TouchableOpacity
              style={styles.saveNotesButton}
              onPress={handleSaveAsNotes}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              )}
              <Text style={styles.saveNotesText}>
                {isSaving ? 'Saving...' : 'Save as Notes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    scrollContent: {
      paddingBottom: 40,
    },
    playerPlaceholder: {
      width: '100%',
      height: 220,
      backgroundColor: '#111',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#00000080',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    videoChannel: {
      fontSize: 14,
      color: colors.textSecondary,
      paddingHorizontal: 20,
      marginTop: 4,
      marginBottom: 16,
    },
    summarizeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
    },
    summarizeText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
      marginLeft: 8,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      marginHorizontal: 20,
    },
    errorText: {
      fontSize: 14,
      color: colors.error || '#e53e3e',
      marginTop: 8,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    retryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    summarySection: {
      margin: 20,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
    },
    summaryBody: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
    saveNotesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    saveNotesText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
    },
  });
