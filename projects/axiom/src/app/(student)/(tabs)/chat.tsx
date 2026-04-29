import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const CONVERSATIONS = [
  {
    id: '1',
    title: 'Explain Newton\'s Laws',
    lastMessage: 'Sure! Newton\'s First Law states that an object at rest stays at rest...',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    title: 'Organic Chemistry — SN1 vs SN2',
    lastMessage: 'The key difference lies in the mechanism. SN1 is a two-step process...',
    timestamp: 'Yesterday',
  },
  {
    id: '3',
    title: 'Integration techniques',
    lastMessage: 'Let me walk you through integration by parts with an example...',
    timestamp: '2 days ago',
  },
  {
    id: '4',
    title: 'NEET Biology — Cell Division',
    lastMessage: 'Mitosis has 4 phases: prophase, metaphase, anaphase, and telophase...',
    timestamp: '3 days ago',
  },
];

export default function ChatScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();

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
  });

  const renderItem = ({ item }: { item: typeof CONVERSATIONS[0] }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => router.push(`/(student)/chat/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <Text style={styles.conversationTitle}>{item.title}</Text>
      <Text style={styles.conversationPreview} numberOfLines={2}>
        {item.lastMessage}
      </Text>
      <Text style={styles.conversationTime}>{item.timestamp}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
      </View>

      <FlatList
        data={CONVERSATIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(student)/chat/new' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
