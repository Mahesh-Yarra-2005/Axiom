import { create } from 'zustand';

interface Note {
  id: string;
  student_id: string;
  title: string;
  content_json: string;
  subject: string;
  chapter: string;
  source_type: 'manual' | 'chat_export' | 'video_summary';
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface NotesState {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),
  deleteNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
}));
