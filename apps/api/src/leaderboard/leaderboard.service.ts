import { Injectable } from '@nestjs/common';
import type { LeaderboardEntryDto } from '@quiz-rush/shared';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  private globalKey() {
    return 'lb:global';
  }

  private weeklyKey() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `lb:weekly:${now.getFullYear()}-W${week}`;
  }

  async submitScore(userId: string, score: number) {
    // Keep best score for global; add for weekly cumulative
    const current = await this.redis.zrevrangeWithScores(this.globalKey(), 0, -1);
    const existing = current.find((e) => e.member === userId);
    if (!existing || score > existing.score) {
      await this.redis.zadd(this.globalKey(), score, userId);
    }

    const weekly = await this.redis.zrevrangeWithScores(this.weeklyKey(), 0, -1);
    const wExisting = weekly.find((e) => e.member === userId);
    const newWeekly = (wExisting?.score ?? 0) + score;
    await this.redis.zadd(this.weeklyKey(), newWeekly, userId);
  }

  async getBoard(type: 'global' | 'weekly', limit = 50): Promise<LeaderboardEntryDto[]> {
    const key = type === 'global' ? this.globalKey() : this.weeklyKey();
    const rows = await this.redis.zrevrangeWithScores(key, 0, limit - 1);
    if (!rows.length) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.member) } },
      select: { id: true, username: true, level: true },
    });
    const map = new Map(users.map((u) => [u.id, u]));

    return rows.map((row, idx) => {
      const u = map.get(row.member);
      return {
        rank: idx + 1,
        userId: row.member,
        username: u?.username ?? 'Joueur',
        score: row.score,
        level: u?.level ?? 1,
      };
    });
  }

  async percentBeaten(userId: string, score: number): Promise<number> {
    const key = this.globalKey();
    const card = await this.redis.zcard(key);
    if (card <= 1) return 50;
    const rows = await this.redis.zrevrangeWithScores(key, 0, -1);
    const beaten = rows.filter((r) => r.member !== userId && r.score < score).length;
    const others = Math.max(card - 1, 1);
    return Math.round((beaten / others) * 100);
  }
}
