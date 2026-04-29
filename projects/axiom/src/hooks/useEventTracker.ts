/**
 * Event Tracking Hook — Records all student learning events
 * Powers: teacher dashboards, AI nudges, gamification, knowledge gap detection
 */
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore, XP_REWARDS } from '@/stores/gamificationStore';

type EventType =
  | 'session_start' | 'session_end'
  | 'flashcard_reviewed' | 'flashcard_created'
  | 'quiz_started' | 'quiz_completed' | 'quiz_question_answered'
  | 'note_created' | 'note_viewed'
  | 'video_watched' | 'video_summarized'
  | 'chat_message_sent' | 'chat_message_received'
  | 'concept_mastered' | 'concept_struggled'
  | 'goal_set' | 'goal_completed'
  | 'assignment_started' | 'assignment_submitted'
  | 'streak_continued' | 'streak_broken'
  | 'level_up' | 'badge_earned';

interface EventPayload {
  subject?: string;
  chapter?: string;
  node_id?: number;
  duration_seconds?: number;
  score?: number;
  metadata?: Record<string, any>;
}

// XP mapping for events
const EVENT_XP_MAP: Partial<Record<EventType, number>> = {
  flashcard_reviewed: XP_REWARDS.flashcard_reviewed,
  flashcard_created: 5,
  quiz_completed: XP_REWARDS.quiz_completed,
  note_created: XP_REWARDS.note_created,
  video_watched: 10,
  video_summarized: XP_REWARDS.video_summarized,
  concept_mastered: XP_REWARDS.flashcard_mastered,
  assignment_submitted: 25,
};

export function useEventTracker() {
  const { studentId } = useAuthStore();
  const { awardXP } = useGamificationStore();

  const trackEvent = useCallback(async (
    eventType: EventType,
    payload: EventPayload = {}
  ) => {
    if (!studentId) return;

    try {
      // Insert event
      await supabase.from('study_events').insert({
        student_id: studentId,
        event_type: eventType,
        subject: payload.subject,
        chapter: payload.chapter,
        node_id: payload.node_id,
        duration_seconds: payload.duration_seconds,
        score: payload.score,
        metadata: payload.metadata || {},
      });

      // Award XP if applicable
      const xpAmount = EVENT_XP_MAP[eventType];
      if (xpAmount) {
        await awardXP(studentId, xpAmount, eventType);
      }

      // Special XP bonuses
      if (eventType === 'quiz_completed' && payload.score && payload.score >= 90) {
        await awardXP(studentId, XP_REWARDS.quiz_perfect_score - XP_REWARDS.quiz_completed, 'quiz_perfect_score');
      }

      // Update daily progress for session events
      if (eventType === 'session_end' && payload.duration_seconds) {
        const today = new Date().toISOString().split('T')[0];
        const minutes = Math.round(payload.duration_seconds / 60);

        await supabase.rpc('increment_daily_progress', {
          p_student_id: studentId,
          p_date: today,
          p_minutes: minutes,
        }).catch(() => {
          // Fallback: upsert directly
          supabase.from('daily_progress').upsert({
            student_id: studentId,
            date: today,
            study_minutes: minutes,
          }, { onConflict: 'student_id,date' });
        });
      }
    } catch (err) {
      console.warn('Event tracking error:', err);
      // Non-blocking — don't crash the app for analytics
    }
  }, [studentId, awardXP]);

  const trackSessionStart = useCallback(() => trackEvent('session_start'), [trackEvent]);

  const trackFlashcardReview = useCallback((subject: string, score: number, nodeId?: number) => {
    trackEvent('flashcard_reviewed', { subject, score, node_id: nodeId });
    if (score >= 4) {
      trackEvent('concept_mastered', { subject, node_id: nodeId });
    } else if (score <= 1) {
      trackEvent('concept_struggled', { subject, node_id: nodeId });
    }
  }, [trackEvent]);

  const trackQuizComplete = useCallback((subject: string, score: number, duration: number) => {
    trackEvent('quiz_completed', { subject, score, duration_seconds: duration });
  }, [trackEvent]);

  const trackNoteCreated = useCallback((subject: string, chapter?: string) => {
    trackEvent('note_created', { subject, chapter });
  }, [trackEvent]);

  const trackVideoWatched = useCallback((subject: string, duration: number) => {
    trackEvent('video_watched', { subject, duration_seconds: duration });
  }, [trackEvent]);

  const trackChatMessage = useCallback((subject?: string) => {
    trackEvent('chat_message_sent', { subject });
  }, [trackEvent]);

  return {
    trackEvent,
    trackSessionStart,
    trackFlashcardReview,
    trackQuizComplete,
    trackNoteCreated,
    trackVideoWatched,
    trackChatMessage,
  };
}
