import React, { useState } from 'react';
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

const VIDEO_DATA: Record<string, any> = {
  v1: {
    title: 'Rotational Mechanics Explained',
    channel: 'Physics Wallah',
    duration: '32:15',
  },
  v2: {
    title: 'Organic Chemistry — Reaction Mechanisms',
    channel: 'Unacademy',
    duration: '45:20',
  },
  v3: {
    title: 'Calculus — Integration by Parts',
    channel: 'Khan Academy',
    duration: '28:40',
  },
};

const SAMPLE_SUMMARY = {
  timestamps: [
    { time: '0:00', label: 'Introduction to Rotational Motion' },
    { time: '4:30', label: 'Moment of Inertia' },
    { time: '12:15', label: 'Torque and Angular Acceleration' },
    { time: '20:00', label: 'Conservation of Angular Momentum' },
    { time: '28:45', label: 'Solved Examples' },
  ],
  concepts: [
    'Moment of inertia depends on mass distribution relative to axis',
    'Torque is the rotational equivalent of force (τ = r × F)',
    'Angular momentum is conserved when net external torque is zero',
    'Parallel axis theorem: I = I_cm + Md²',
  ],
  takeaways: [
    'Always identify the axis of rotation first',
    'Use energy conservation for problems involving rolling',
    'Angular momentum conservation applies to collisions',
    'Practice problems from HC Verma Chapter 10',
  ],
};

export default function VideoDetail() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showSummary, setShowSummary] = useState(false);

  const video = VIDEO_DATA[id || 'v1'] || VIDEO_DATA['v1'];
  const styles = makeStyles(colors);

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
          <Text style={styles.durationBadge}>{video.duration}</Text>
        </View>

        <Text style={styles.videoTitle}>{video.title}</Text>
        <Text style={styles.videoChannel}>{video.channel}</Text>

        {/* Summarize Button */}
        <TouchableOpacity
          style={styles.summarizeButton}
          onPress={() => setShowSummary(true)}
        >
          <Ionicons name="sparkles" size={20} color="#000" />
          <Text style={styles.summarizeText}>Summarize</Text>
        </TouchableOpacity>

        {/* Summary Section */}
        {showSummary && (
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.summaryTitle}>AI Summary</Text>
            </View>

            {/* Key Timestamps */}
            <Text style={styles.subSectionTitle}>Key Timestamps</Text>
            {SAMPLE_SUMMARY.timestamps.map((ts, index) => (
              <View key={index} style={styles.timestampRow}>
                <Text style={styles.timestampTime}>{ts.time}</Text>
                <Text style={styles.timestampLabel}>{ts.label}</Text>
              </View>
            ))}

            {/* Main Concepts */}
            <Text style={styles.subSectionTitle}>Main Concepts</Text>
            {SAMPLE_SUMMARY.concepts.map((concept, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>{concept}</Text>
              </View>
            ))}

            {/* Key Takeaways */}
            <Text style={styles.subSectionTitle}>Key Takeaways</Text>
            {SAMPLE_SUMMARY.takeaways.map((takeaway, index) => (
              <View key={index} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.bulletText}>{takeaway}</Text>
              </View>
            ))}

            {/* Save as Notes */}
            <TouchableOpacity style={styles.saveNotesButton}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={styles.saveNotesText}>Save as Notes</Text>
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
    durationBadge: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: '#000000CC',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
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
    subSectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    timestampRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    timestampTime: {
      width: 45,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    timestampLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
      paddingLeft: 4,
    },
    bullet: {
      color: colors.primary,
      fontSize: 16,
      marginRight: 8,
      lineHeight: 22,
    },
    bulletText: {
      flex: 1,
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
