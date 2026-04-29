import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

type UserRole = 'student' | 'parent' | 'teacher';

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  profile: any | null;
  isLoading: boolean;
  isOnboarded: boolean;
  setSession: (session: Session | null) => void;
  setRole: (role: UserRole | null) => void;
  setProfile: (profile: any) => void;
  setIsOnboarded: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setRole: (role) => set({ role }),
  setProfile: (profile) => set({ profile }),
  setIsOnboarded: (val) => set({ isOnboarded: val }),
  setIsLoading: (val) => set({ isLoading: val }),
  reset: () => set({ session: null, user: null, role: null, profile: null, isLoading: false, isOnboarded: false }),
}));
