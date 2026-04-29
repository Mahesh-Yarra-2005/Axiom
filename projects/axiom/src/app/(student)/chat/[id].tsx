import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useChatStore } from '@/stores/chatStore';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { BloomLevels } from '@/constants/blooms';

interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  is_starred: boolean;
  is_hots: boolean;
  blooms_level: string | null;
  created_at: string;
}

export default function ChatDetailScreen() {
  useStudyTracker();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const { profile } = useAuthStore();
  const {
    currentMessages,
    isStreaming,
    streamingText,
    suggestions,
    setCurrentMessages,
    addMessage,
    toggleStar,
    setHots,
  } = useChatStore();
  const { sendMessage } = useStreamingChat();

  const [input, setInput] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showBloomsPicker, setShowBloomsPicker] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      loadMessages();
    } else {
      setCurrentMessages([]);
    }
  }, [id]);

  async function loadMessages() {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (data) setCurrentMessages(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const userMessage: MessageItem = {
      id: Date.now().toString(),
      conversation_id: id || 'new',
      role: 'user',
      content: input.trim(),
      is_starred: false,
      is_hots: false,
      blooms_level: null,
      created_at: new Date().toISOString(),
    };

    addMessage(userMessage);
    const messageText = input.trim();
    setInput('');

    // Build messages array for AI
    const messages = [...currentMessages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await sendMessage(id || 'new', messages);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    }
  }

  function handleSuggestionTap(suggestion: string) {
    setInput(suggestion);
  }

  async function handleExportAsNote(message: MessageItem) {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      if (!student) return;

      await supabase.from('notes').insert({
        student_id: student.id,
        title: `Chat Export - ${new Date().toLocaleDateString()}`,
        content_json: message.content,
        source_type: 'chat_export',
        subject: '',
        chapter: '',
      });

      Alert.alert('Saved', 'Message exported to Notes');
    } catch (e) {
      Alert.alert('Error', 'Failed to export note');
    }
    setShowActions(null);
  }

  async function handleToggleStar(messageId: string) {
    toggleStar(messageId);
    try {
      const msg = currentMessages.find((m) => m.id === messageId);
      if (msg) {
        await supabase
          .from('messages')
          .update({ is_starred: !msg.is_starred })
          .eq('id', messageId);
      }
    } catch (e) {
      console.error('Failed to update star:', e);
    }
    setShowActions(null);
  }

  function handleSetHots(messageId: string, level: string) {
    setHots(messageId, level);
    setShowBloomsPicker(null);
    setShowActions(null);
    // Persist to DB
    supabase
      .from('messages')
      .update({ is_hots: true, blooms_level: level })
      .eq('id', messageId)
      .then();
  }

  function renderMessage({ item }: { item: MessageItem }) {
    const isUser = item.role === 'user';

    return (
      <View style={styles.messageContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onLongPress={() => !isUser && setShowActions(showActions === item.id ? null : item.id)}
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.aiBubble, { backgroundColor: colors.card }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#000' : colors.text },
            ]}
          >
            {item.content}
          </Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {item.is_starred && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '30' }]}>
                <Ionicons name="star" size={12} color={colors.primary} />
              </View>
            )}
            {item.is_hots && item.blooms_level && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '30' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {item.blooms_level}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Action menu for AI messages */}
        {showActions === item.id && !isUser && (
          <View style={[styles.actionsRow, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleToggleStar(item.id)}
            >
              <Ionicons
                name={item.is_starred ? 'star' : 'star-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Star</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowBloomsPicker(item.id)}
            >
              <Ionicons name="school" size={18} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>HOTS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleExportAsNote(item)}
            >
              <Ionicons name="document-text" size={18} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Notes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bloom's Level Picker */}
        {showBloomsPicker === item.id && (
          <View style={[styles.bloomsPicker, { backgroundColor: colors.surface }]}>
            {BloomLevels.map((bl) => (
              <TouchableOpacity
                key={bl.level}
                style={[styles.bloomsChip, { borderColor: bl.color }]}
                onPress={() => handleSetHots(item.id, bl.name)}
              >
                <Text style={[styles.bloomsChipText, { color: bl.color }]}>{bl.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderStreamingMessage() {
    if (!isStreaming || !streamingText) return null;

    return (
      <View style={styles.messageContainer}>
        <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card }]}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            {streamingText}
            <Text style={{ color: colors.primary }}>|</Text>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Axiom AI</Text>
          {isStreaming && (
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>typing...</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={renderStreamingMessage}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={[styles.emptyChatIcon]}>🎓</Text>
              <Text style={[styles.emptyChatTitle, { color: colors.text }]}>
                Ask me anything
              </Text>
              <Text style={[styles.emptyChatDesc, { color: colors.textSecondary }]}>
                I'm your AI study companion for JEE, NEET, and CBSE
              </Text>
            </View>
          }
        />

        {/* Go Beyond Suggestions */}
        {suggestions.length > 0 && !isStreaming && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
              Go Beyond:
            </Text>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                onPress={() => handleSuggestionTap(s)}
              >
                <Text style={[styles.suggestionText, { color: colors.primary }]} numberOfLines={2}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Ask a question..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() ? colors.primary : colors.card },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Ionicons name="send" size={18} color={input.trim() ? '#000' : colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  messageContainer: {
    marginBottom: 8,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  actionBtn: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  bloomsPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  bloomsChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  bloomsChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    gap: 8,
  },
  emptyChatIcon: { fontSize: 48 },
  emptyChatTitle: { fontSize: 22, fontWeight: '700' },
  emptyChatDesc: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
