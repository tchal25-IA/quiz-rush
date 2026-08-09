import { MAX_LEVEL } from './constants';

/** XP required to go from level L to L+1 */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.4));
}

export function addXp(
  currentLevel: number,
  currentXp: number,
  gained: number,
): { level: number; xp: number; leveledUp: boolean } {
  let level = currentLevel;
  let xp = currentXp + gained;
  let leveledUp = false;

  while (level < MAX_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    leveledUp = true;
  }

  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
  }

  return { level, xp, leveledUp };
}

/** XP gained from a finished solo session */
export function sessionXp(correctCount: number, maxCombo: number, perfect: boolean): number {
  const base = correctCount * 15;
  const comboBonus = maxCombo * 5;
  const perfectBonus = perfect ? 50 : 0;
  return base + comboBonus + perfectBonus;
}
