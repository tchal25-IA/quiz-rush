export const QUESTIONS_PER_SESSION = 10;
export const QUESTION_TIME_SECONDS = 10;
export const JOKER_BONUS_SECONDS = 5;
export const BASE_POINTS = 100;
export const DUEL_MIN_LEVEL = 5;
export const DUEL_MATCHMAKING_TIMEOUT_MS = 30_000;
export const JOKER_RECHARGE_HOURS = 6;
export const MAX_LEVEL = 50;
export const MAX_ADS_PER_DAY = 5;
export const PREMIUM_PRICE_EUR = 4.99;

export const CATEGORIES = [
  { slug: 'culture-g', name: 'Culture Générale', icon: '🧠', color: '#F59E0B' },
  { slug: 'histoire', name: 'Histoire', icon: '🏛️', color: '#8B5CF6' },
  { slug: 'sciences', name: 'Sciences', icon: '🔬', color: '#06B6D4' },
  { slug: 'geographie', name: 'Géographie', icon: '🌍', color: '#22C55E' },
  { slug: 'sport', name: 'Sport', icon: '⚽', color: '#EF4444' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const JOKER_TYPES = ['fifty_fifty', 'time_bonus', 'community'] as const;
export type JokerType = (typeof JOKER_TYPES)[number];
