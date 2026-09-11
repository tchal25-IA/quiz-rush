import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayChallenge() {
    const today = this.getTodayDate();
    let challenge = await this.prisma.dailyChallenge.findUnique({
      where: { date: today },
    });

    if (!challenge) {
      challenge = await this.createDailyChallenge(today);
    }

    return challenge;
  }

  async getLeaderboard(challengeId: string, limit = 10) {
    const participations = await this.prisma.dailyChallengeParticipation.findMany({
      where: {
        challengeId,
        completed: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
            isGuest: true,
          },
        },
      },
      orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
      take: limit,
    });

    return participations.map((p, idx) => ({
      rank: idx + 1,
      userId: p.user.id,
      username: p.user.username,
      level: p.user.level,
      isGuest: p.user.isGuest,
      score: p.score,
      correct: p.correct,
      maxCombo: p.maxCombo,
      completedAt: p.completedAt,
    }));
  }

  async getUserParticipation(userId: string, challengeId: string) {
    return this.prisma.dailyChallengeParticipation.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
    });
  }

  async recordParticipation(
    userId: string,
    challengeId: string,
    sessionId: string,
    score: number,
    correct: number,
    maxCombo: number,
  ) {
    return this.prisma.dailyChallengeParticipation.upsert({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
      create: {
        userId,
        challengeId,
        sessionId,
        score,
        correct,
        maxCombo,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        sessionId,
        score,
        correct,
        maxCombo,
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  private getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private async createDailyChallenge(date: Date) {
    const categories = await this.prisma.category.findMany({
      orderBy: { order: 'asc' },
    });

    if (categories.length === 0) {
      throw new Error('No categories available');
    }

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    const questions = await this.prisma.question.findMany({
      where: {
        categoryId: randomCategory.id,
        status: 'active',
      },
      take: 10,
      orderBy: { timesShown: 'asc' },
    });

    if (questions.length < 10) {
      throw new Error('Not enough questions for daily challenge');
    }

    return this.prisma.dailyChallenge.create({
      data: {
        date,
        categoryId: randomCategory.id,
        questionIds: questions.map((q) => q.id),
      },
    });
  }
}
