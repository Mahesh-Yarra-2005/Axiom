export interface SM2Card {
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
}

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

// Quality mapping for UI: Again=1, Hard=2, Good=4, Easy=5
export const QualityLabels = [
  { label: 'Again', quality: 1 as Quality, color: '#EF4444' },
  { label: 'Hard', quality: 2 as Quality, color: '#FF9800' },
  { label: 'Good', quality: 4 as Quality, color: '#4CAF50' },
  { label: 'Easy', quality: 5 as Quality, color: '#D4AF37' },
];

export function sm2(card: SM2Card, quality: Quality): SM2Card {
  let { ease_factor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * ease_factor);
    repetitions += 1;
  }

  // Update ease factor
  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    ease_factor,
    interval,
    repetitions,
    next_review: next.toISOString(),
  };
}
