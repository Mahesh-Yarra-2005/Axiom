import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';

/**
 * AI Nudges Generator — Proactive student interventions
 *
 * Called periodically (via cron) or on-demand by teachers.
 * Analyzes student behavior patterns and generates personalized nudges.
 */

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { student_id, check_all = false } = await req.json();

    // Get students to check
    let studentIds: number[] = [];
    if (student_id) {
      studentIds = [student_id];
    } else if (check_all) {
      const { data: students } = await supabase.from('students').select('id');
      studentIds = (students || []).map((s: any) => s.id);
    }

    const nudgesCreated: any[] = [];

    for (const sid of studentIds) {
      // Fetch recent activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        { data: progress },
        { data: xpData },
        { data: recentEvents },
        { data: existingNudges },
      ] = await Promise.all([
        supabase.from('daily_progress')
          .select('date, study_minutes')
          .eq('student_id', sid)
          .gte('date', sevenDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false }),
        supabase.from('student_xp')
          .select('current_streak, last_activity_date')
          .eq('student_id', sid)
          .single(),
        supabase.from('study_events')
          .select('event_type, created_at, metadata')
          .eq('student_id', sid)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('ai_nudges')
          .select('nudge_type, created_at')
          .eq('student_id', sid)
          .eq('is_dismissed', false)
          .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      ]);

      // Don't create duplicate nudges within 24h
      const recentNudgeTypes = new Set((existingNudges || []).map((n: any) => n.nudge_type));

      // Calculate metrics
      const daysActive = (progress || []).filter((p: any) => p.study_minutes > 0).length;
      const totalMinutes = (progress || []).reduce((s: number, p: any) => s + (p.study_minutes || 0), 0);
      const lastActivityDate = xpData?.last_activity_date;
      const currentStreak = xpData?.current_streak || 0;
      const daysSinceActive = lastActivityDate
        ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / 86400000)
        : 999;

      // === NUDGE RULES ===

      // 1. Inactivity nudge (no study for 2+ days)
      if (daysSinceActive >= 2 && !recentNudgeTypes.has('inactivity')) {
        nudgesCreated.push({
          student_id: sid,
          nudge_type: 'inactivity',
          title: 'We miss you!',
          message: daysSinceActive >= 5
            ? `It's been ${daysSinceActive} days since your last study session. Even 15 minutes today can help maintain your knowledge.`
            : `You haven't studied in ${daysSinceActive} days. A quick review session can prevent forgetting.`,
          metadata: { days_inactive: daysSinceActive },
        });
      }

      // 2. Streak at risk (active yesterday but not today, after 5 PM)
      const hourNow = new Date().getHours();
      if (currentStreak >= 3 && daysSinceActive === 1 && hourNow >= 17 && !recentNudgeTypes.has('streak_at_risk')) {
        nudgesCreated.push({
          student_id: sid,
          nudge_type: 'streak_at_risk',
          title: `${currentStreak}-day streak at risk!`,
          message: `You're about to lose your ${currentStreak}-day streak! Even a 10-minute flashcard review will keep it alive.`,
          metadata: { streak: currentStreak },
          expires_at: new Date(new Date().setHours(23, 59, 59)).toISOString(),
        });
      }

      // 3. Review due nudge (many cards due)
      const { data: dueCards } = await supabase.from('flashcards')
        .select('id')
        .eq('student_id', sid)
        .lte('next_review', new Date().toISOString());

      if ((dueCards || []).length >= 10 && !recentNudgeTypes.has('review_due')) {
        nudgesCreated.push({
          student_id: sid,
          nudge_type: 'review_due',
          title: 'Cards waiting for review',
          message: `You have ${(dueCards || []).length} flashcards due for review. Reviewing now gives optimal retention.`,
          metadata: { due_count: (dueCards || []).length },
        });
      }

      // 4. Struggle detection (many "again" ratings on flashcards)
      const struggleEvents = (recentEvents || []).filter(
        (e: any) => e.event_type === 'concept_struggled'
      );
      if (struggleEvents.length >= 5 && !recentNudgeTypes.has('struggle_detected')) {
        nudgesCreated.push({
          student_id: sid,
          nudge_type: 'struggle_detected',
          title: 'Looks like you need help',
          message: `You've been struggling with some concepts recently. Would you like Axiom to break them down differently?`,
          metadata: { struggle_count: struggleEvents.length },
        });
      }

      // 5. Encouragement (good progress)
      if (daysActive >= 5 && totalMinutes >= 300 && !recentNudgeTypes.has('encouragement')) {
        nudgesCreated.push({
          student_id: sid,
          nudge_type: 'encouragement',
          title: 'Amazing work this week!',
          message: `You've studied ${Math.round(totalMinutes / 60)} hours over ${daysActive} days. You're in the top percentile of consistency!`,
          metadata: { hours: Math.round(totalMinutes / 60), days: daysActive },
        });
      }

      // 6. Study suggestion (hasn't studied a subject in a while)
      // Check subjects not touched in 3+ days
      const recentSubjects = new Set(
        (recentEvents || []).filter((e: any) => e.metadata?.subject).map((e: any) => e.metadata.subject)
      );
      const { data: studentNotes } = await supabase.from('notes')
        .select('subject')
        .eq('student_id', sid)
        .not('subject', 'is', null);

      const allSubjects = [...new Set((studentNotes || []).map((n: any) => n.subject))];
      const neglectedSubjects = allSubjects.filter(s => !recentSubjects.has(s));

      if (neglectedSubjects.length > 0 && !recentNudgeTypes.has('study_suggestion')) {
        nudgesCreated.push({
          student_id: sid,
          nudge_type: 'study_suggestion',
          title: `Don't forget ${neglectedSubjects[0]}`,
          message: `You haven't reviewed ${neglectedSubjects[0]} recently. Balanced study across subjects leads to better exam performance.`,
          metadata: { neglected_subjects: neglectedSubjects },
        });
      }
    }

    // Batch insert nudges
    if (nudgesCreated.length > 0) {
      await supabase.from('ai_nudges').insert(nudgesCreated);
    }

    return new Response(JSON.stringify({
      success: true,
      nudges_created: nudgesCreated.length,
      students_checked: studentIds.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('AI nudges error:', err);
    return errorResponse(err.message || 'Failed to generate nudges', 500);
  }
});
