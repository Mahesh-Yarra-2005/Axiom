import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { session, role, isOnboarded } = useAuthStore();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!role) {
    return <Redirect href="/(auth)/role-select" />;
  }

  if (role === 'student' && !isOnboarded) {
    return <Redirect href="/(student)/onboarding/syllabus" />;
  }

  if (role === 'parent') {
    return <Redirect href="/(parent)/(tabs)/home" />;
  }

  if (role === 'teacher') {
    return <Redirect href="/(teacher)/(tabs)/home" />;
  }

  return <Redirect href="/(student)/(tabs)/home" />;
}
