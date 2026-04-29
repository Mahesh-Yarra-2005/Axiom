import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { streamEdgeFunction } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function useStreamingChat() {
  const { setIsStreaming, setStreamingText, appendStreamingText, addMessage, setSuggestions } = useChatStore();

  const sendMessage = useCallback(async (
    conversationId: string,
    messages: Array<{ role: string; content: string }>,
  ) => {
    setIsStreaming(true);
    setStreamingText('');
    setSuggestions([]);

    // Save user message to DB (last message in array is the new one)
    const userMsg = messages[messages.length - 1];
    if (conversationId && conversationId !== 'new') {
      supabase.from('messages').insert({
        conversation_id: parseInt(conversationId),
        role: userMsg.role,
        content: userMsg.content,
      }).then();
    }

    try {
      const fullText = await streamEdgeFunction('chat', {
        conversation_id: conversationId,
        messages,
      }, (chunk) => {
        appendStreamingText(chunk);
      });

      // Parse suggestions from response
      const suggestionsMatch = fullText.match(/\[SUGGESTIONS\]:\s*([\s\S]*?)$/);
      if (suggestionsMatch) {
        const suggestions = suggestionsMatch[1]
          .split(/\d+\.\s+/)
          .filter(s => s.trim())
          .map(s => s.trim());
        setSuggestions(suggestions);
      }

      // Add the complete message
      const cleanContent = fullText.replace(/\[SUGGESTIONS\]:[\s\S]*$/, '').trim();
      addMessage({
        id: Date.now().toString(),
        conversation_id: conversationId,
        role: 'assistant',
        content: cleanContent,
        is_starred: false,
        is_hots: false,
        blooms_level: null,
        created_at: new Date().toISOString(),
      });

      // Save assistant message to DB
      if (conversationId && conversationId !== 'new') {
        supabase.from('messages').insert({
          conversation_id: parseInt(conversationId),
          role: 'assistant',
          content: cleanContent,
        }).then();

        // Update conversation title if it's the first exchange
        if (messages.length <= 2) {
          const title = userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? '...' : '');
          supabase.from('conversations').update({ title }).eq('id', parseInt(conversationId)).then();
        }
      }

      return cleanContent;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  }, []);

  return { sendMessage };
}
