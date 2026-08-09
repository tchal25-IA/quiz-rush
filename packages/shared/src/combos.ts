/** Combo streak → score multiplier (CDC) */
export function getComboMultiplier(streak: number): number {
  if (streak <= 0) return 1;
  if (streak === 1) return 1;
  if (streak === 2) return 1.5;
  if (streak === 3) return 2;
  if (streak === 4) return 2.5;
  if (streak === 5) return 3;
  if (streak <= 7) return 3.5;
  if (streak <= 9) return 4;
  return 5; // 10 = PERFECT
}

export function isPerfectCombo(streak: number): boolean {
  return streak >= 10;
}

export function computePoints(basePoints: number, streakAfterCorrect: number): number {
  return Math.round(basePoints * getComboMultiplier(streakAfterCorrect));
}
