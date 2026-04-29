import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { streamEdgeFunction } from '@/lib/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: "Hello! I'm your parenting advisor. I can help you understand your child's study progress, suggest schedules, and provide advice on exam stress management.",
  isUser: false,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function ParentChat() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const styles = makeStyles(colors);

  // Load existing conversation on mount
  useEffect(() => {
    async function loadConversation() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get parent record to find linked students
        const { data: parent } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!parent) {
          setLoading(false);
          return;
        }

        // Look for an existing parent conversation
        // We use a convention: conversations with title 'parent_chat' and student_id
        // from one of the linked students. For parent chats, we'll use the first linked student.
        const { data: links } = await supabase
          .from('parent_student_links')
          .select('student_id')
          .eq('parent_id', parent.id)
          .limit(1);

        if (!links || links.length === 0) {
          setLoading(false);
          return;
        }

        const studentId = links[0].student_id;

        // Check for existing parent conversation
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('student_id', studentId)
          .eq('title', 'parent_chat')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (conversation) {
          setConversationId(conversation.id);

          // Load messages
          const { data: dbMessages } = await supabase
            .from('messages')
            .select('id, role, content, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          if (dbMessages && dbMessages.length > 0) {
            const loadedMessages: Message[] = dbMessages.map((msg: any) => ({
              id: String(msg.id),
              text: msg.content,
              isUser: msg.role === 'user',
              timestamp: new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConversation();
  }, [user?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || streaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setStreaming(true);

    // Create a placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.text,
        }));

      history.push({ role: 'user', content: messageText });

      const fullText = await streamEdgeFunction(
        'parent-chat',
        {
          messages: history,
          conversation_id: conversationId,
          user_id: user?.id,
        },
        (chunk: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
            )
          );
        }
      );

      // Update the final message text
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId ? { ...msg, text: fullText } : msg
        )
      );
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Parent Advisor</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Parent Advisor</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {!message.isUser && (
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
              )}
              <Text
                style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  message.isUser ? styles.userTimestamp : styles.aiTimestamp,
                ]}
              >
                {message.timestamp}
              </Text>
            </View>
          ))}
          {streaming && messages[messages.length - 1]?.text === '' && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your child's progress..."
            placeholderTextColor={colors.textSecondary}
            multiline
            editable={!streaming}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: inputText.trim() && !streaming ? 1 : 0.5 },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || streaming}
          >
            <Ionicons name="send" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 10,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 8,
    },
    messageBubble: {
      maxWidth: '80%',
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    aiIcon: {
      marginBottom: 6,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userMessageText: {
      color: '#000',
    },
    aiMessageText: {
      color: colors.text,
    },
    timestamp: {
      fontSize: 11,
      marginTop: 6,
    },
    userTimestamp: {
      color: '#00000060',
      textAlign: 'right',
    },
    aiTimestamp: {
      color: colors.textSecondary,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
  });
