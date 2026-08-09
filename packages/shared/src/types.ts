import type { CategorySlug, JokerType } from './constants';

export type AnswerKey = 'A' | 'B' | 'C' | 'D';

export interface PublicUser {
  id: string;
  username: string;
  level: number;
  xp: number;
  gems: number;
  streak: number;
  isGuest: boolean;
  isPremium: boolean;
  jokers: JokerInventory;
}

export interface JokerInventory {
  fifty_fifty: number;
  time_bonus: number;
  community: number;
  nextRechargeAt: string | null;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: CategorySlug | string;
  icon: string;
  color: string;
  order: number;
}

export interface QuestionPublicDto {
  id: string;
  text: string;
  answers: { key: AnswerKey; text: string }[];
  timeLimit: number;
  explanation?: string;
}

export interface AnswerResultDto {
  correct: boolean;
  correctAnswer: AnswerKey;
  explanation?: string | null;
  pointsEarned: number;
  combo: number;
  multiplier: number;
  score: number;
  perfect?: boolean;
  eliminatedKeys?: AnswerKey[];
  communityPercents?: Partial<Record<AnswerKey, number>>;
}

export interface SessionResultDto {
  sessionId: string;
  score: number;
  maxCombo: number;
  correctCount: number;
  totalQuestions: number;
  xpGained: number;
  gemsGained: number;
  percentBeaten: number;
  leveledUp: boolean;
  level: number;
  perfect: boolean;
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  username: string;
  score: number;
  level: number;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export type GameMode = 'solo' | 'duel' | 'challenge_friend' | 'thematic';

export interface DuelStateDto {
  duelId: string;
  status: 'matching' | 'ready' | 'playing' | 'finished' | 'timeout';
  opponent?: { id: string; username: string; level: number };
  questions?: QuestionPublicDto[];
  myScore?: number;
  opponentScore?: number;
  winnerId?: string | null;
}

export type { JokerType, CategorySlug };
