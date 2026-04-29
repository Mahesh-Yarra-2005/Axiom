import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useStudyTracker() {
  const startTime = useRef<number>(Date.now());
  const { user } = useAuthStore();

  const saveStudyTime = async () => {
    const elapsedMs = Date.now() - startTime.current;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    if (elapsedMinutes < 1 || !user) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) return;

      // Check if a record exists for today
      const { data: existing } = await supabase
        .from('daily_progress')
        .select('id, study_minutes')
        .eq('student_id', student.id)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('daily_progress')
          .update({ study_minutes: existing.study_minutes + elapsedMinutes })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_progress')
          .insert({ student_id: student.id, date: today, study_minutes: elapsedMinutes });
      }
    } catch (e) {
      console.error('Failed to save study time:', e);
    }

    // Reset timer after saving
    startTime.current = Date.now();
  };

  useEffect(() => {
    startTime.current = Date.now();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        saveStudyTime();
      } else if (nextState === 'active') {
        startTime.current = Date.now();
      }
    });

    return () => {
      saveStudyTime();
      subscription.remove();
    };
  }, [user]);
}
