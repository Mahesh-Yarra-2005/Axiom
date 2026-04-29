import { Platform } from 'react-native';

export const Colors = {
  dark: {
    background: '#000000',
    surface: '#1A1A1A',
    card: '#242424',
    primary: '#D4AF37',       // gold
    primaryMuted: '#B8942E',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    border: '#333333',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#EF4444',
    inputBg: '#1A1A1A',
  },
  light: {
    background: '#FAF9F6',
    surface: '#FFFDD0',
    card: '#FFE4D6',
    primary: '#D4AF37',
    primaryMuted: '#B8942E',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#EF4444',
    inputBg: '#FFFFFF',
  },
};

export type ThemeColors = typeof Colors.dark;
export type ColorScheme = 'dark' | 'light';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const BorderRadius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const FontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, xxxl: 34 };

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
