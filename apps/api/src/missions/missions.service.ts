import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const missions = await this.prisma.mission.findMany({ where: { active: true } });
    const progress = await this.prisma.userMission.findMany({ where: { userId } });
    const map = new Map(progress.map((p) => [p.missionId, p]));

    return missions.map((m) => {
      const p = map.get(m.id);
      return {
        ...m,
        progress: p?.progress ?? 0,
        completed: p?.completed ?? false,
        claimed: p?.claimed ?? false,
      };
    });
  }

  async progressAfterSolo(userId: string, correctCount: number, perfect: boolean) {
    await this.bump(userId, 'play_solo', 1);
    if (correctCount >= 7) await this.bump(userId, 'score_7plus', 1);
    if (perfect) await this.bump(userId, 'perfect_run', 1);
  }

  async claim(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission introuvable');

    const progress = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (!progress?.completed) throw new BadRequestException('Mission non terminée');
    if (progress.claimed) throw new BadRequestException('Récompense déjà réclamée');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: mission.xpReward },
        gems: { increment: mission.gemsReward },
      },
    });
    await this.prisma.userMission.update({
      where: { userId_missionId: { userId, missionId } },
      data: { claimed: true },
    });

    return {
      ok: true,
      xpReward: mission.xpReward,
      gemsReward: mission.gemsReward,
    };
  }

  private async bump(userId: string, code: string, amount: number) {
    const mission = await this.prisma.mission.findUnique({ where: { code } });
    if (!mission) return;

    const existing = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId: mission.id } },
    });

    if (existing?.completed) return;

    const progress = Math.min(mission.target, (existing?.progress ?? 0) + amount);
    const completed = progress >= mission.target;

    await this.prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId: mission.id } },
      create: {
        userId,
        missionId: mission.id,
        progress,
        completed,
        claimed: false,
      },
      update: { progress, completed },
    });
  }
}
