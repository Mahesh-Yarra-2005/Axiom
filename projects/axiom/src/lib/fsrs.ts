/**
 * FSRS (Free Spaced Repetition Scheduler) v4
 *
 * Research-backed algorithm that outperforms SM-2 by ~30% in retention.
 * Based on: https://github.com/open-spaced-repetition/fsrs4anki
 *
 * Key differences from SM-2:
 * - Uses memory stability and difficulty as core parameters
 * - Models forgetting curves mathematically
 * - Supports desired retention rate customization
 * - Better handles lapses and relearning
 */

export type FSRSState = 'new' | 'learning' | 'review' | 'relearning';
export type FSRSRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface FSRSCard {
  stability: number;      // Memory stability (days until R drops to 90%)
  difficulty: number;     // Item difficulty (1-10)
  elapsed_days: number;   // Days since last review
  scheduled_days: number; // Scheduled interval
  reps: number;           // Total review count
  lapses: number;         // Times forgotten (rated Again in review state)
  state: FSRSState;
  last_review: string | null;
  next_review: string;
}

export interface FSRSParams {
  request_retention: number;  // Desired retention rate (0.7 - 0.99)
  maximum_interval: number;   // Max interval in days
  w: number[];               // Model weights (19 parameters)
}

// Default FSRS v4 parameters (trained on millions of reviews)
export const DEFAULT_PARAMS: FSRSParams = {
  request_retention: 0.9,
  maximum_interval: 36500, // 100 years max
  w: [
    0.4072, 1.1829, 3.1262, 15.4722,  // Initial stability for each rating
    7.2102,                             // Initial difficulty
    0.5316, 1.0651,                     // Difficulty modifiers
    0.0092,                             // Stability after forgetting base
    1.5671, 0.2853, 1.0490,            // Stability after forgetting modifiers
    1.9262, 0.1110,                     // Recall stability modifiers
    0.3567,                             // Difficulty mean reversion
    2.2653, 0.2315, 2.9898,            // Hard/Easy penalty/bonus
    0.5163, 0.6571                      // Short-term stability modifiers
  ],
};

export const RatingLabels = [
  { label: 'Again', rating: 1 as FSRSRating, color: '#EF4444', description: 'Forgot completely' },
  { label: 'Hard', rating: 2 as FSRSRating, color: '#FF9800', description: 'Recalled with difficulty' },
  { label: 'Good', rating: 3 as FSRSRating, color: '#4CAF50', description: 'Recalled correctly' },
  { label: 'Easy', rating: 4 as FSRSRating, color: '#D4AF37', description: 'Effortless recall' },
];

/**
 * Calculate retrievability (probability of recall) at a given time
 */
export function retrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * Calculate the next interval based on desired retention
 */
function nextInterval(stability: number, params: FSRSParams): number {
  const interval = Math.round(
    (stability / 9) * (Math.pow(1 / params.request_retention, 1) - 1)
  );
  return Math.min(Math.max(interval, 1), params.maximum_interval);
}

/**
 * Calculate initial difficulty from first rating
 */
function initDifficulty(rating: FSRSRating, w: number[]): number {
  return constrain(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1, 10);
}

/**
 * Calculate initial stability from first rating
 */
function initStability(rating: FSRSRating, w: number[]): number {
  return Math.max(w[rating - 1], 0.1);
}

/**
 * Update difficulty after a review
 */
function nextDifficulty(d: number, rating: FSRSRating, w: number[]): number {
  const newD = d - w[6] * (rating - 3);
  // Mean reversion towards initial difficulty
  const meanReverted = w[7] * initDifficulty(3, w) + (1 - w[7]) * newD;
  return constrain(meanReverted, 1, 10);
}

/**
 * Calculate new stability after successful recall
 */
function nextRecallStability(
  d: number,
  s: number,
  r: number,
  rating: FSRSRating,
  w: number[]
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;

  return s * (
    1 +
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp((1 - r) * w[10]) - 1) *
    hardPenalty *
    easyBonus
  );
}

/**
 * Calculate new stability after forgetting (lapse)
 */
function nextForgetStability(
  d: number,
  s: number,
  r: number,
  w: number[]
): number {
  return Math.max(
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp((1 - r) * w[14]),
    0.1
  );
}

/**
 * Constrain a value between min and max
 */
function constrain(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Main FSRS scheduling function
 * Takes a card and rating, returns the updated card state
 */
export function fsrs(
  card: FSRSCard,
  rating: FSRSRating,
  params: FSRSParams = DEFAULT_PARAMS
): FSRSCard {
  const now = new Date();
  const { w } = params;

  let { stability, difficulty, reps, lapses, state } = card;

  // Calculate elapsed days since last review
  const elapsedDays = card.last_review
    ? Math.max(0, Math.floor((now.getTime() - new Date(card.last_review).getTime()) / 86400000))
    : 0;

  // Current retrievability
  const r = state === 'review' ? retrievability(stability, elapsedDays) : 0;

  switch (state) {
    case 'new': {
      // First time seeing this card
      stability = initStability(rating, w);
      difficulty = initDifficulty(rating, w);
      reps = 1;

      if (rating === 1) {
        state = 'learning';
      } else if (rating === 2) {
        state = 'learning';
      } else {
        state = 'review';
      }
      break;
    }

    case 'learning':
    case 'relearning': {
      // In learning/relearning phase
      stability = initStability(rating, w);
      difficulty = nextDifficulty(difficulty, rating, w);
      reps += 1;

      if (rating === 1) {
        // Stay in current state
        lapses += state === 'learning' ? 0 : 0; // Don't count learning lapses
      } else if (rating === 2) {
        // Still learning
      } else {
        // Graduate to review
        state = 'review';
      }
      break;
    }

    case 'review': {
      // Reviewing a mature card
      difficulty = nextDifficulty(difficulty, rating, w);
      reps += 1;

      if (rating === 1) {
        // Lapse — forgot the card
        lapses += 1;
        stability = nextForgetStability(difficulty, stability, r, w);
        state = 'relearning';
      } else {
        // Successful recall
        stability = nextRecallStability(difficulty, stability, r, rating, w);
      }
      break;
    }
  }

  // Calculate next review date
  let scheduledDays: number;
  if (state === 'learning' || state === 'relearning') {
    // Short intervals for learning cards
    if (rating === 1) scheduledDays = 0; // Same day (minutes in reality)
    else if (rating === 2) scheduledDays = 1;
    else scheduledDays = Math.max(1, nextInterval(stability, params));
  } else {
    scheduledDays = nextInterval(stability, params);
  }

  const nextReview = new Date(now);
  if (scheduledDays === 0) {
    // Review again in 10 minutes (for "Again" in learning)
    nextReview.setMinutes(nextReview.getMinutes() + 10);
  } else {
    nextReview.setDate(nextReview.getDate() + scheduledDays);
  }

  return {
    stability: Math.round(stability * 100) / 100,
    difficulty: Math.round(difficulty * 100) / 100,
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    reps,
    lapses,
    state,
    last_review: now.toISOString(),
    next_review: nextReview.toISOString(),
  };
}

/**
 * Get the predicted intervals for all ratings (for showing in UI)
 */
export function previewIntervals(
  card: FSRSCard,
  params: FSRSParams = DEFAULT_PARAMS
): { rating: FSRSRating; interval: number; label: string }[] {
  return ([1, 2, 3, 4] as FSRSRating[]).map(rating => {
    const result = fsrs(card, rating, params);
    return {
      rating,
      interval: result.scheduled_days,
      label: formatInterval(result.scheduled_days),
    };
  });
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days === 0) return '10m';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/**
 * Create a new FSRS card with default values
 */
export function createNewCard(): FSRSCard {
  return {
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 'new',
    last_review: null,
    next_review: new Date().toISOString(),
  };
}

/**
 * Calculate card maturity (for analytics)
 * Returns: 'new' | 'young' | 'mature'
 */
export function cardMaturity(card: FSRSCard): 'new' | 'young' | 'mature' {
  if (card.state === 'new') return 'new';
  if (card.stability < 21) return 'young';
  return 'mature';
}

/**
 * Calculate study load metrics
 */
export function calculateStudyLoad(cards: FSRSCard[]): {
  dueToday: number;
  dueThisWeek: number;
  newCards: number;
  matureCards: number;
  averageRetention: number;
} {
  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);

  let totalRetention = 0;
  let reviewableCards = 0;

  const result = {
    dueToday: 0,
    dueThisWeek: 0,
    newCards: 0,
    matureCards: 0,
    averageRetention: 0,
  };

  for (const card of cards) {
    const nextReview = new Date(card.next_review);

    if (card.state === 'new') {
      result.newCards++;
    } else {
      if (card.stability >= 21) result.matureCards++;

      const elapsed = Math.max(0, (now.getTime() - new Date(card.last_review || now.toISOString()).getTime()) / 86400000);
      totalRetention += retrievability(card.stability, elapsed);
      reviewableCards++;
    }

    if (nextReview <= now) result.dueToday++;
    if (nextReview <= weekLater) result.dueThisWeek++;
  }

  result.averageRetention = reviewableCards > 0
    ? Math.round((totalRetention / reviewableCards) * 100)
    : 100;

  return result;
}
