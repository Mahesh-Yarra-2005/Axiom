import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, type ColorScheme, type ThemeColors } from '@/constants/theme';

interface ThemeState {
  scheme: ColorScheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setScheme: (scheme: ColorScheme) => void;
  loadSavedTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  scheme: 'dark',
  colors: Colors.dark,
  toggleTheme: () => set((state) => {
    const newScheme = state.scheme === 'dark' ? 'light' : 'dark';
    AsyncStorage.setItem('theme', newScheme);
    return { scheme: newScheme, colors: Colors[newScheme] };
  }),
  setScheme: (scheme) => {
    AsyncStorage.setItem('theme', scheme);
    set({ scheme, colors: Colors[scheme] });
  },
  loadSavedTheme: () => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        set({ scheme: saved, colors: Colors[saved] });
      }
    });
  },
}));
