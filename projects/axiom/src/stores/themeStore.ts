import { create } from 'zustand';
import { Colors, type ColorScheme, type ThemeColors } from '@/constants/theme';

interface ThemeState {
  scheme: ColorScheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setScheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  scheme: 'dark',
  colors: Colors.dark,
  toggleTheme: () => set((state) => {
    const newScheme = state.scheme === 'dark' ? 'light' : 'dark';
    return { scheme: newScheme, colors: Colors[newScheme] };
  }),
  setScheme: (scheme) => set({ scheme, colors: Colors[scheme] }),
}));
