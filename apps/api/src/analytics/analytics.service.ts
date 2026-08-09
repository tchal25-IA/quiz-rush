import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackMany(
    userId: string | undefined,
    events: { name: string; props?: Record<string, unknown>; ts?: string }[],
  ) {
    if (!events.length) return { ok: true, saved: 0 };
    const data: Prisma.AnalyticsEventCreateManyInput[] = events.slice(0, 50).map((e) => ({
      userId: userId ?? null,
      name: e.name.slice(0, 80),
      props: e.props ? (e.props as Prisma.InputJsonValue) : undefined,
      sessionId:
        typeof e.props?.sessionId === 'string' ? (e.props.sessionId as string).slice(0, 64) : null,
      createdAt: e.ts ? new Date(e.ts) : new Date(),
    }));
    await this.prisma.analyticsEvent.createMany({ data });
    return { ok: true, saved: data.length };
  }

  async funnelSummary() {
    const since = new Date(Date.now() - 7 * 86400000);
    const names = [
      'app_open',
      'solo_start',
      'solo_finish',
      'share_click',
      'challenge_create',
      'duel_queue',
      'claim_account',
    ];
    const rows = await this.prisma.analyticsEvent.groupBy({
      by: ['name'],
      where: { createdAt: { gte: since }, name: { in: names } },
      _count: { _all: true },
    });
    const map = Object.fromEntries(rows.map((r) => [r.name, r._count._all]));
    const opens = map.app_open ?? 0;
    const starts = map.solo_start ?? 0;
    const finishes = map.solo_finish ?? 0;
    return {
      windowDays: 7,
      counts: map,
      conversion: {
        openToStart: opens ? Number(((starts / opens) * 100).toFixed(1)) : 0,
        startToFinish: starts ? Number(((finishes / starts) * 100).toFixed(1)) : 0,
      },
    };
  }
}
