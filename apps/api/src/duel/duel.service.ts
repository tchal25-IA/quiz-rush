import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DUEL_MATCHMAKING_TIMEOUT_MS,
  DUEL_MIN_LEVEL,
  QUESTIONS_PER_SESSION,
  BASE_POINTS,
  computePoints,
} from '@quiz-rush/shared';
import type { AnswerKey } from '@quiz-rush/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QuizService } from '../quiz/quiz.service';

const QUEUE_KEY = 'duel:queue';

@Injectable()
export class DuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly quiz: QuizService,
  ) {}

  async enqueue(userId: string, categoryId?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.level < DUEL_MIN_LEVEL) {
      throw new BadRequestException(`Niveau ${DUEL_MIN_LEVEL} requis pour les duels`);
    }

    const category = categoryId
      ? await this.prisma.category.findUnique({ where: { id: categoryId } })
      : await this.prisma.category.findFirst({ orderBy: { order: 'asc' } });
    if (!category) throw new NotFoundException('Catégorie introuvable');

    // Try match existing queue
    const queue = await this.redis.lrange(QUEUE_KEY, 0, -1);
    for (const raw of queue) {
      const entry = JSON.parse(raw) as { userId: string; categoryId: string; duelId: string; ts: number };
      if (entry.userId === userId) continue;
      if (Date.now() - entry.ts > DUEL_MATCHMAKING_TIMEOUT_MS) {
        await this.redis.lrem(QUEUE_KEY, 1, raw);
        continue;
      }

      await this.redis.lrem(QUEUE_KEY, 1, raw);
      return this.pairPlayers(entry.duelId, entry.userId, userId, entry.categoryId);
    }

    const pool = await this.prisma.question.findMany({
      where: { categoryId: category.id, status: 'active' },
      select: { id: true },
    });
    const questionIds = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, QUESTIONS_PER_SESSION)
      .map((q) => q.id);

    const duel = await this.prisma.duel.create({
      data: {
        player1Id: userId,
        categoryId: category.id,
        questionIds,
        status: 'matching',
      },
    });

    await this.redis.lpush(
      QUEUE_KEY,
      JSON.stringify({
        userId,
        categoryId: category.id,
        duelId: duel.id,
        ts: Date.now(),
      }),
    );

    return {
      duelId: duel.id,
      status: 'matching' as const,
      timeoutMs: DUEL_MATCHMAKING_TIMEOUT_MS,
    };
  }

  private async pairPlayers(
    duelId: string,
    player1Id: string,
    player2Id: string,
    categoryId: string,
  ) {
    const duel = await this.prisma.duel.update({
      where: { id: duelId },
      data: {
        player2Id,
        status: 'ready',
      },
      include: {
        player1: { select: { id: true, username: true, level: true } },
        player2: { select: { id: true, username: true, level: true } },
      },
    });

    const questions = await Promise.all(
      duel.questionIds.map((id) => this.quiz.getQuestionPublic(id)),
    );

    return {
      duelId: duel.id,
      status: 'ready' as const,
      categoryId,
      opponent: duel.player2Id === player2Id ? duel.player1 : duel.player2!,
      questions,
      player1: duel.player1,
      player2: duel.player2!,
    };
  }

  async getDuel(duelId: string, userId: string) {
    const duel = await this.prisma.duel.findUnique({
      where: { id: duelId },
      include: {
        player1: { select: { id: true, username: true, level: true } },
        player2: { select: { id: true, username: true, level: true } },
      },
    });
    if (!duel) throw new NotFoundException();
    if (duel.player1Id !== userId && duel.player2Id !== userId) {
      throw new BadRequestException('Pas ton duel');
    }

    const questions =
      duel.status === 'matching'
        ? undefined
        : await Promise.all(duel.questionIds.map((id) => this.quiz.getQuestionPublic(id)));

    const opponent =
      duel.player1Id === userId ? duel.player2 ?? undefined : duel.player1;

    return {
      duelId: duel.id,
      status: duel.status,
      opponent,
      questions,
      myScore: duel.player1Id === userId ? duel.player1Score : duel.player2Score,
      opponentScore: duel.player1Id === userId ? duel.player2Score : duel.player1Score,
      winnerId: duel.winnerId,
    };
  }

  async submitDuelAnswer(
    userId: string,
    duelId: string,
    questionIndex: number,
    answer: AnswerKey,
  ) {
    const duel = await this.prisma.duel.findUnique({ where: { id: duelId } });
    if (!duel || !duel.player2Id) throw new NotFoundException();
    if (duel.player1Id !== userId && duel.player2Id !== userId) {
      throw new BadRequestException();
    }

    const questionId = duel.questionIds[questionIndex];
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException();

    const correct = question.correctAnswer === answer;
    // Simplified duel scoring: streak tracked client-side; server awards base*combo approx by index streak stored in redis
    const streakKey = `duel:${duelId}:streak:${userId}`;
    const prev = Number((await this.redis.get(streakKey)) ?? 0);
    const streak = correct ? prev + 1 : 0;
    await this.redis.set(streakKey, String(streak), 600);
    const points = correct ? computePoints(BASE_POINTS, streak) : 0;

    const isP1 = duel.player1Id === userId;
    const progressKey = `duel:${duelId}:progress:${userId}`;
    await this.redis.set(progressKey, String(questionIndex + 1), 600);

    const updated = await this.prisma.duel.update({
      where: { id: duelId },
      data: isP1
        ? { player1Score: { increment: points }, status: 'playing' }
        : { player2Score: { increment: points }, status: 'playing' },
    });

    const p1Done = Number((await this.redis.get(`duel:${duelId}:progress:${duel.player1Id}`)) ?? 0);
    const p2Done = Number((await this.redis.get(`duel:${duelId}:progress:${duel.player2Id}`)) ?? 0);
    let finished = false;
    let winnerId: string | null = null;

    if (p1Done >= QUESTIONS_PER_SESSION && p2Done >= QUESTIONS_PER_SESSION) {
      finished = true;
      const fresh = await this.prisma.duel.findUniqueOrThrow({ where: { id: duelId } });
      if (fresh.player1Score > fresh.player2Score) winnerId = fresh.player1Id;
      else if (fresh.player2Score > fresh.player1Score) winnerId = fresh.player2Id!;
      else winnerId = null;
      await this.prisma.duel.update({
        where: { id: duelId },
        data: { status: 'finished', winnerId, finishedAt: new Date() },
      });
    }

    return {
      correct,
      correctAnswer: question.correctAnswer,
      pointsEarned: points,
      myScore: isP1 ? updated.player1Score : updated.player2Score,
      finished,
      winnerId,
    };
  }

  async cancelMatchmaking(userId: string) {
    const queue = await this.redis.lrange(QUEUE_KEY, 0, -1);
    for (const raw of queue) {
      const entry = JSON.parse(raw) as { userId: string };
      if (entry.userId === userId) await this.redis.lrem(QUEUE_KEY, 1, raw);
    }
    return { ok: true };
  }
}
