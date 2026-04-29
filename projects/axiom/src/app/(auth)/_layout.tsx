import { Stack } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

export default function AuthLayout() {
  const { colors } = useThemeStore();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
