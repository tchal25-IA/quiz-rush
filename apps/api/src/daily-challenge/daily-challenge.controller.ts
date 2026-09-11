import { Controller, Get, Post, UseGuards, Req, Param, Body } from '@nestjs/common';
import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DailyChallengeService } from './daily-challenge.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuizService } from '../quiz/quiz.service';
import type { AnswerKey } from '@quiz-rush/shared';
import type { Request } from 'express';

class AnswerDto {
  @IsIn(['A', 'B', 'C', 'D'])
  answer!: AnswerKey;

  @IsInt()
  @Min(0)
  @Max(60)
  timeSpent!: number;
}

@Controller('daily-challenge')
@UseGuards(JwtAuthGuard)
export class DailyChallengeController {
  constructor(
    private readonly dailyChallengeService: DailyChallengeService,
    private readonly quizService: QuizService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('today')
  async getToday(@Req() req: Request) {
    const userId = (req.user as any).id;
    const challenge = await this.dailyChallengeService.getTodayChallenge();

    const category = await this.prisma.category.findUnique({
      where: { id: challenge.categoryId },
    });

    const participation = await this.dailyChallengeService.getUserParticipation(userId, challenge.id);

    return {
      challengeId: challenge.id,
      date: challenge.date,
      category: {
        id: category?.id,
        name: category?.name,
        slug: category?.slug,
        icon: category?.icon,
        color: category?.color,
      },
      totalQuestions: challenge.questionIds.length,
      hasParticipated: !!participation?.completed,
      userScore: participation?.score ?? null,
      userCorrect: participation?.correct ?? null,
    };
  }

  @Post('start')
  async start(@Req() req: Request) {
    const userId = (req.user as any).id;
    const challenge = await this.dailyChallengeService.getTodayChallenge();

    const participation = await this.dailyChallengeService.getUserParticipation(userId, challenge.id);

    if (participation?.completed) {
      return { error: 'Vous avez déjà complété le défi du jour', canRetry: false };
    }

    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        categoryId: challenge.categoryId,
        mode: 'daily',
        questionIds: challenge.questionIds,
      },
    });

    const firstQuestion = await this.prisma.question.findUnique({
      where: { id: challenge.questionIds[0] },
    });

    if (!firstQuestion) {
      throw new Error('Question not found');
    }

    await this.prisma.question.update({
      where: { id: firstQuestion.id },
      data: { timesShown: { increment: 1 } },
    });

    return {
      sessionId: session.id,
      challengeId: challenge.id,
      question: {
        id: firstQuestion.id,
        text: firstQuestion.text,
        answers: [
          { key: 'A', text: firstQuestion.answerA },
          { key: 'B', text: firstQuestion.answerB },
          { key: 'C', text: firstQuestion.answerC },
          { key: 'D', text: firstQuestion.answerD },
        ],
      },
      questionIndex: 0,
      totalQuestions: challenge.questionIds.length,
    };
  }

  @Post('answer/:sessionId')
  async answer(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
    @Body() dto: AnswerDto,
  ) {
    const userId = (req.user as any).id;
    const result = await this.quizService.answer(userId, sessionId, dto.answer, dto.timeSpent);

    if (result.finished && result.result) {
      const session = await this.prisma.quizSession.findUnique({
        where: { id: sessionId },
      });

      if (session && session.mode === 'daily') {
        const todayChallenge = await this.dailyChallengeService.getTodayChallenge();
        await this.dailyChallengeService.recordParticipation(
          userId,
          todayChallenge.id,
          sessionId,
          result.result.score,
          result.result.correctCount,
          result.result.maxCombo,
        );
      }
    }

    return result;
  }

  @Post('joker/:sessionId')
  async joker(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
    @Body() dto: { type: 'fifty_fifty' | 'time_bonus' | 'community' },
  ) {
    const userId = (req.user as any).id;
    return this.quizService.useJoker(userId, sessionId, dto.type);
  }

  @Get('leaderboard')
  async getLeaderboard(@Req() req: Request) {
    const userId = (req.user as any).id;
    const challenge = await this.dailyChallengeService.getTodayChallenge();
    const leaderboard = await this.dailyChallengeService.getLeaderboard(challenge.id, 50);

    const userRank = leaderboard.findIndex((entry) => entry.userId === userId);

    return {
      challengeId: challenge.id,
      date: challenge.date,
      leaderboard,
      userRank: userRank >= 0 ? userRank + 1 : null,
    };
  }
}
