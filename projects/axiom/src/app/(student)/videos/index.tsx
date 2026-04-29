import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { callEdgeFunction } from '@/lib/api';

const PEER_PICKS = [
  { id: 'v1', title: 'Rotational Mechanics Explained', channel: 'Physics Wallah', duration: '32:15' },
  { id: 'v2', title: 'Organic Chemistry — Reactions', channel: 'Unacademy', duration: '45:20' },
  { id: 'v3', title: 'Calculus Made Easy', channel: 'Khan Academy', duration: '28:40' },
];

interface VideoResult {
  id: string;
  title: string;
  description?: string;
  channel: string;
  thumbnail?: string;
  published_at?: string;
}

export default function VideosIndex() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const data = await callEdgeFunction('search-videos', { query, subject: '' });
      setSearchResults(data.videos || []);
    } catch (err: any) {
      setSearchError(err.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
  };

  const renderVideoCard = (video: VideoResult, compact = false) => (
    <TouchableOpacity
      key={video.id}
      style={compact ? styles.peerCard : styles.videoCard}
      onPress={() =>
        router.push({
          pathname: '/(student)/videos/[id]',
          params: { id: video.id, title: video.title, channel: video.channel, thumbnail: video.thumbnail || '' },
        })
      }
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
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Loading */}
        {isSearching && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>Searching...</Text>
          </View>
        )}

        {/* Error */}
        {searchError && !isSearching && (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error || colors.textSecondary} />
            <Text style={styles.emptyText}>{searchError}</Text>
          </View>
        )}

        {/* Peer Picks — show when no search is active */}
        {!searchResults && !isSearching && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peer Picks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PEER_PICKS.map((video) => renderVideoCard(video as VideoResult, true))}
            </ScrollView>
          </View>
        )}

        {/* Search Results */}
        {searchResults && !isSearching && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="videocam-off-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No videos found</Text>
              </View>
            ) : (
              searchResults.map((video) => renderVideoCard(video))
            )}
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
