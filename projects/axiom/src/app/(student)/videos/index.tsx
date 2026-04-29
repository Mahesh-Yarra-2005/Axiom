import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const PEER_PICKS = [
  { id: 'v1', title: 'Rotational Mechanics Explained', channel: 'Physics Wallah', duration: '32:15' },
  { id: 'v2', title: 'Organic Chemistry — Reactions', channel: 'Unacademy', duration: '45:20' },
  { id: 'v3', title: 'Calculus Made Easy', channel: 'Khan Academy', duration: '28:40' },
];

const ALL_VIDEOS = [
  { id: 'v1', title: 'Rotational Mechanics Explained', channel: 'Physics Wallah', duration: '32:15', subject: 'Physics' },
  { id: 'v2', title: 'Organic Chemistry — Reaction Mechanisms', channel: 'Unacademy', duration: '45:20', subject: 'Chemistry' },
  { id: 'v3', title: 'Calculus — Integration by Parts', channel: 'Khan Academy', duration: '28:40', subject: 'Mathematics' },
  { id: 'v4', title: 'Electromagnetic Induction', channel: 'Physics Wallah', duration: '38:10', subject: 'Physics' },
  { id: 'v5', title: 'Chemical Bonding & Molecular Structure', channel: 'Vedantu', duration: '52:30', subject: 'Chemistry' },
  { id: 'v6', title: 'Cell Division — Mitosis & Meiosis', channel: 'BYJU\'S', duration: '25:45', subject: 'Biology' },
];

export default function VideosIndex() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const styles = makeStyles(colors);

  const filteredVideos = searchQuery.trim()
    ? ALL_VIDEOS.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_VIDEOS;

  const renderVideoCard = (video: typeof ALL_VIDEOS[0], compact = false) => (
    <TouchableOpacity
      key={video.id}
      style={compact ? styles.peerCard : styles.videoCard}
      onPress={() => router.push(`/(student)/videos/${video.id}`)}
      activeOpacity={0.7}
    >
      <View style={compact ? styles.peerThumbnail : styles.thumbnail}>
        <Ionicons name="play-circle" size={compact ? 28 : 36} color={colors.primary} />
      </View>
      <View style={compact ? styles.peerInfo : styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.videoChannel}>{video.channel}</Text>
        <Text style={styles.videoDuration}>{video.duration}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Hub</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search videos by topic or subject..."
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Peer Picks */}
        {!searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peer Picks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PEER_PICKS.map((video) => renderVideoCard(video as any, true))}
            </ScrollView>
          </View>
        )}

        {/* All Videos / Search Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'All Videos'}
          </Text>
          {filteredVideos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-off-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No videos found</Text>
            </View>
          ) : (
            filteredVideos.map((video) => renderVideoCard(video))
          )}
        </View>
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
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      marginLeft: 10,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    peerCard: {
      width: 200,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    peerThumbnail: {
      height: 100,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    peerInfo: {
      padding: 10,
    },
    videoCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    thumbnail: {
      width: 120,
      height: 80,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoInfo: {
      flex: 1,
      padding: 10,
      justifyContent: 'center',
    },
    videoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    videoChannel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    videoDuration: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 12,
    },
  });
