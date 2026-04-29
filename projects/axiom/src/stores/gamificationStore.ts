/**
 * Gamification Store — XP, Levels, Streaks, Badges, Challenges
 */
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// XP rewards for different actions
export const XP_REWARDS = {
  flashcard_reviewed: 5,
  flashcard_mastered: 20,
  quiz_completed: 30,
  quiz_perfect_score: 100,
  note_created: 15,
  study_session_30min: 25,
  study_session_60min: 50,
  streak_milestone_7: 100,
  streak_milestone_30: 500,
  daily_challenge_completed: 100,
  first_of_day: 10,
  video_summarized: 20,
  discussion_answer_accepted: 30,
} as const;

// Level thresholds (exponential curve)
export function levelFromXP(xp: number): number {
  // Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250 XP, etc.
  // Formula: level = floor(1 + sqrt(xp / 50))
  return Math.floor(1 + Math.sqrt(xp / 50));
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 50;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percentage: number } {
  const currentLevel = levelFromXP(xp);
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(currentLevel + 1);
  const current = xp - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  return { current, needed, percentage: Math.min(100, Math.round((current / needed) * 100)) };
}

// Level titles
export function levelTitle(level: number): string {
  if (level <= 5) return 'Novice Learner';
  if (level <= 10) return 'Curious Mind';
  if (level <= 15) return 'Knowledge Seeker';
  if (level <= 20) return 'Rising Scholar';
  if (level <= 30) return 'Dedicated Student';
  if (level <= 40) return 'Academic Warrior';
  if (level <= 50) return 'Mastery Pursuer';
  if (level <= 75) return 'Wisdom Keeper';
  if (level <= 100) return 'Grand Scholar';
  return 'Axiom Legend';
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: string;
  xpReward: number;
  completed: boolean;
}

interface GamificationState {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  todayChallenges: DailyChallenge[];
  loading: boolean;

  // Actions
  fetchGamificationData: (studentId: number) => Promise<void>;
  awardXP: (studentId: number, amount: number, reason: string) => Promise<void>;
  checkStreakStatus: (studentId: number) => Promise<void>;
  checkBadgeEligibility: (studentId: number) => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  totalXp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  todayChallenges: [],
  loading: false,

  fetchGamificationData: async (studentId: number) => {
    set({ loading: true });

    // Fetch XP
    const { data: xpData } = await supabase
      .from('student_xp')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (xpData) {
      set({
        totalXp: xpData.total_xp || 0,
        level: xpData.level || 1,
        currentStreak: xpData.current_streak || 0,
        longestStreak: xpData.longest_streak || 0,
      });
    }

    // Fetch badges
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*');

    const { data: earnedBadges } = await supabase
      .from('student_badges')
      .select('badge_id, earned_at')
      .eq('student_id', studentId);

    const earnedIds = new Set((earnedBadges || []).map((b: any) => String(b.badge_id)));
    const earnedMap = new Map((earnedBadges || []).map((b: any) => [String(b.badge_id), b.earned_at]));

    set({
      badges: (allBadges || []).map((b: any) => ({
        id: String(b.id),
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
        xpReward: b.xp_reward,
        earned: earnedIds.has(String(b.id)),
        earnedAt: earnedMap.get(String(b.id)),
      })),
    });

    // Fetch today's challenges
    const today = new Date().toISOString().split('T')[0];
    const { data: challenges } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today);

    const { data: completedChallenges } = await supabase
      .from('student_challenges')
      .select('challenge_id')
      .eq('student_id', studentId);

    const completedIds = new Set((completedChallenges || []).map((c: any) => String(c.challenge_id)));

    set({
      todayChallenges: (challenges || []).map((c: any) => ({
        id: String(c.id),
        title: c.title,
        description: c.description,
        type: c.challenge_type,
        xpReward: c.xp_reward,
        completed: completedIds.has(String(c.id)),
      })),
      loading: false,
    });
  },

  awardXP: async (studentId: number, amount: number, reason: string) => {
    const currentXP = get().totalXp;
    const newXP = currentXP + amount;
    const newLevel = levelFromXP(newXP);
    const oldLevel = get().level;

    // Upsert XP record
    await supabase
      .from('student_xp')
      .upsert({
        student_id: studentId,
        total_xp: newXP,
        level: newLevel,
        last_activity_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'student_id' });

    set({ totalXp: newXP, level: newLevel });

    // Log event if leveled up
    if (newLevel > oldLevel) {
      await supabase.from('study_events').insert({
        student_id: studentId,
        event_type: 'level_up',
        metadata: { old_level: oldLevel, new_level: newLevel, reason },
      });
    }
  },

  checkStreakStatus: async (studentId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if studied today
    const { data: todayProgress } = await supabase
      .from('daily_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    if (todayProgress) {
      // Already counted for today
      return;
    }

    // Check if streak is at risk (no activity yesterday)
    const { data: yesterdayProgress } = await supabase
      .from('daily_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', yesterday)
      .single();

    if (!yesterdayProgress && get().currentStreak > 0) {
      // Streak broken!
      await supabase
        .from('student_xp')
        .update({ current_streak: 0 })
        .eq('student_id', studentId);

      set({ currentStreak: 0 });

      // Create nudge
      await supabase.from('ai_nudges').insert({
        student_id: studentId,
        nudge_type: 'streak_broken',
        title: 'Streak Lost!',
        message: `Your ${get().longestStreak}-day streak ended. Start a new one today!`,
      });
    }
  },

  checkBadgeEligibility: async (studentId: number) => {
    const { badges, currentStreak } = get();
    const unearnedBadges = badges.filter(b => !b.earned);

    for (const badge of unearnedBadges) {
      let earned = false;
      // Check criteria based on badge category
      // (simplified - in production, would check each criteria type)
      if (badge.category === 'streak') {
        const criteria = JSON.parse(JSON.stringify(badge));
        if (criteria.criteria?.value && currentStreak >= criteria.criteria.value) {
          earned = true;
        }
      }

      if (earned) {
        await supabase.from('student_badges').insert({
          student_id: studentId,
          badge_id: parseInt(badge.id),
        });

        // Award XP for badge
        await get().awardXP(studentId, badge.xpReward, `Badge earned: ${badge.name}`);

        // Log event
        await supabase.from('study_events').insert({
          student_id: studentId,
          event_type: 'badge_earned',
          metadata: { badge_name: badge.name, badge_id: badge.id },
        });
      }
    }
  },
}));
