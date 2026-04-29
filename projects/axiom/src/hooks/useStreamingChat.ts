import { useCallback, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { streamEdgeFunction } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export function useStreamingChat() {
  const { setIsStreaming, setStreamingText, appendStreamingText, addMessage, setSuggestions } = useChatStore();
  const bloomsLevelRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (
    conversationId: string,
    messages: Array<{ role: string; content: string }>,
  ) => {
    setIsStreaming(true);
    setStreamingText('');
    setSuggestions([]);
    bloomsLevelRef.current = null;

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
      const { fullText, bloomsLevel } = await streamEdgeFunction('chat', {
        conversation_id: conversationId,
        messages,
      }, (chunk) => {
        appendStreamingText(chunk);
      });

      // Capture blooms level from stream result
      if (bloomsLevel) {
        bloomsLevelRef.current = bloomsLevel;
      }

      // Parse suggestions from response
      const suggestionsMatch = fullText.match(/\[SUGGESTIONS\]:\s*([\s\S]*?)$/);
      if (suggestionsMatch) {
        const suggestions = suggestionsMatch[1]
          .split(/\d+\.\s+/)
          .filter(s => s.trim())
          .map(s => s.trim());
        setSuggestions(suggestions);
      }

      // Add the complete message (with Bloom's level if available)
      const cleanContent = fullText.replace(/\[SUGGESTIONS\]:[\s\S]*$/, '').trim();
      const currentBloomsLevel = bloomsLevelRef.current;
      addMessage({
        id: Date.now().toString(),
        conversation_id: conversationId,
        role: 'assistant',
        content: cleanContent,
        is_starred: false,
        is_hots: currentBloomsLevel != null,
        blooms_level: currentBloomsLevel,
        created_at: new Date().toISOString(),
      });

      // Save assistant message to DB, then update with Bloom's classification
      if (conversationId && conversationId !== 'new') {
        const { data: insertedMsg, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: parseInt(conversationId),
            role: 'assistant',
            content: cleanContent,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Failed to save assistant message:', insertError);
        } else if (insertedMsg?.id && currentBloomsLevel) {
          // Persist Bloom's classification
          const { error: updateError } = await supabase
            .from('messages')
            .update({ blooms_level: currentBloomsLevel, is_hots: true })
            .eq('id', insertedMsg.id);

          if (updateError) {
            console.error("Failed to update Bloom's level:", updateError);
          }
        }

        bloomsLevelRef.current = null;

        // Update conversation title if it's the first exchange
        if (messages.length <= 2) {
          const title = userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? '...' : '');
          supabase.from('conversations').update({ title }).eq('id', parseInt(conversationId)).then();
        }
      }

      // After streaming finishes, track weakness asynchronously (don't await, don't block)
      const trackWeakness = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const { data: student } = await supabase
            .from('students').select('id').eq('user_id', session?.user?.id || '').single();
          if (!student) return;

          await fetch(`${SUPABASE_URL}/functions/v1/track-weakness`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token || ''}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages, student_id: student.id }),
          });
        } catch {} // silent — never block the user
      };
      trackWeakness(); // fire and forget

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
