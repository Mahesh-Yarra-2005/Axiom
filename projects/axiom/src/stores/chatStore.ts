import { create } from 'zustand';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  is_starred: boolean;
  is_hots: boolean;
  blooms_level: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  student_id: string;
  title: string;
  summary_text: string | null;
  created_at: string;
}

interface ChatState {
  conversations: Conversation[];
  currentMessages: Message[];
  isStreaming: boolean;
  streamingText: string;
  suggestions: string[];
  setConversations: (convos: Conversation[]) => void;
  setCurrentMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  setIsStreaming: (val: boolean) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (chunk: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  toggleStar: (messageId: string) => void;
  setHots: (messageId: string, level: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentMessages: [],
  isStreaming: false,
  streamingText: '',
  suggestions: [],
  setConversations: (conversations) => set({ conversations }),
  setCurrentMessages: (currentMessages) => set({ currentMessages }),
  addMessage: (msg) => set((state) => ({ currentMessages: [...state.currentMessages, msg] })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingText: (streamingText) => set({ streamingText }),
  appendStreamingText: (chunk) => set((state) => ({ streamingText: state.streamingText + chunk })),
  setSuggestions: (suggestions) => set({ suggestions }),
  toggleStar: (messageId) => set((state) => ({
    currentMessages: state.currentMessages.map(m =>
      m.id === messageId ? { ...m, is_starred: !m.is_starred } : m
    ),
  })),
  setHots: (messageId, level) => set((state) => ({
    currentMessages: state.currentMessages.map(m =>
      m.id === messageId ? { ...m, is_hots: true, blooms_level: level } : m
    ),
  })),
  reset: () => set({ conversations: [], currentMessages: [], isStreaming: false, streamingText: '', suggestions: [] }),
}));
