import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

type BadgeVariant = 'solid' | 'outline';

interface BadgeProps {
  text: string;
  color?: string;
  variant?: BadgeVariant;
}

export function Badge({ text, color, variant = 'solid' }: BadgeProps) {
  const { colors } = useThemeStore();
  const badgeColor = color || colors.primary;

  const containerStyle =
    variant === 'solid'
      ? { backgroundColor: badgeColor }
      : { backgroundColor: 'transparent', borderWidth: 1, borderColor: badgeColor };

  const textColor = variant === 'solid' ? '#000000' : badgeColor;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Badge;
