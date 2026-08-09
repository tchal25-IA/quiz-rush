import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BASE_POINTS,
  QUESTIONS_PER_SESSION,
  QUESTION_TIME_SECONDS,
  JOKER_BONUS_SECONDS,
  computePoints,
  getComboMultiplier,
  isPerfectCombo,
  sessionXp,
  addXp,
} from '@quiz-rush/shared';
import type { AnswerKey, AnswerResultDto, QuestionPublicDto, SessionResultDto } from '@quiz-rush/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { MissionsService } from '../missions/missions.service';

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboard: LeaderboardService,
    private readonly missions: MissionsService,
  ) {}

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { order: 'asc' } });
  }

  async startSolo(userId: string, categoryId?: string) {
    const category = categoryId
      ? await this.prisma.category.findUnique({ where: { id: categoryId } })
      : await this.prisma.category.findFirst({ orderBy: { order: 'asc' } });

    if (!category) throw new NotFoundException('Catégorie introuvable');

    const pool = await this.prisma.question.findMany({
      where: { categoryId: category.id, status: 'active' },
      select: { id: true },
    });

    if (pool.length < QUESTIONS_PER_SESSION) {
      throw new BadRequestException('Pas assez de questions dans cette catégorie');
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const questionIds = shuffled.slice(0, QUESTIONS_PER_SESSION).map((q) => q.id);

    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        categoryId: category.id,
        mode: 'solo',
        questionIds,
      },
    });

    const first = await this.getQuestionPublic(questionIds[0]);
    return {
      sessionId: session.id,
      category,
      questionIndex: 0,
      totalQuestions: QUESTIONS_PER_SESSION,
      question: first,
      score: 0,
      combo: 0,
    };
  }

  async getCurrentQuestion(userId: string, sessionId: string) {
    const session = await this.getActiveSession(userId, sessionId);
    if (session.finishedAt) throw new BadRequestException('Session terminée');
    const qid = session.questionIds[session.currentIndex];
    if (!qid) throw new BadRequestException('Plus de questions');
    return {
      sessionId: session.id,
      questionIndex: session.currentIndex,
      totalQuestions: session.questionIds.length,
      score: session.score,
      combo: session.currentCombo,
      question: await this.getQuestionPublic(qid),
      jokersUsed: {
        fifty_fifty: session.jokerFiftyUsed,
        time_bonus: session.jokerTimeUsed,
        community: session.jokerCommunityUsed,
      },
    };
  }

  async answer(
    userId: string,
    sessionId: string,
    userAnswer: AnswerKey,
    timeSpent: number,
  ): Promise<AnswerResultDto & { finished?: boolean; result?: SessionResultDto; nextQuestion?: QuestionPublicDto }> {
    const session = await this.getActiveSession(userId, sessionId);
    if (session.finishedAt) throw new BadRequestException('Session terminée');

    const questionId = session.questionIds[session.currentIndex];
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question introuvable');

    const correct = question.correctAnswer === userAnswer;
    let combo = session.currentCombo;
    let pointsEarned = 0;
    let maxCombo = session.maxCombo;

    if (correct) {
      combo += 1;
      pointsEarned = computePoints(BASE_POINTS, combo);
      maxCombo = Math.max(maxCombo, combo);
    } else {
      combo = 0;
    }

    const score = session.score + pointsEarned;
    const correctCount = session.correctCount + (correct ? 1 : 0);
    const nextIndex = session.currentIndex + 1;
    const finished = nextIndex >= session.questionIds.length;

    await this.prisma.answer.create({
      data: {
        sessionId: session.id,
        questionId,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: correct,
        comboAtTime: combo,
        pointsEarned,
        timeSpent,
      },
    });

    const countField =
      userAnswer === 'A'
        ? 'answerACount'
        : userAnswer === 'B'
          ? 'answerBCount'
          : userAnswer === 'C'
            ? 'answerCCount'
            : 'answerDCount';

    await this.prisma.question.update({
      where: { id: questionId },
      data: {
        timesShown: { increment: 1 },
        correctAnswers: correct ? { increment: 1 } : undefined,
        [countField]: { increment: 1 },
      },
    });

    await this.prisma.quizSession.update({
      where: { id: session.id },
      data: {
        score,
        currentCombo: combo,
        maxCombo,
        correctCount,
        currentIndex: nextIndex,
      },
    });

    const payload: AnswerResultDto = {
      correct,
      correctAnswer: question.correctAnswer as AnswerKey,
      explanation: question.explanation,
      pointsEarned,
      combo,
      multiplier: getComboMultiplier(combo),
      score,
      perfect: finished && isPerfectCombo(maxCombo),
    };

    if (finished) {
      const result = await this.finishSession(userId, session.id);
      return { ...payload, finished: true, result };
    }

    const nextQuestion = await this.getQuestionPublic(session.questionIds[nextIndex]);
    return { ...payload, finished: false, nextQuestion };
  }

  async useJoker(
    userId: string,
    sessionId: string,
    type: 'fifty_fifty' | 'time_bonus' | 'community',
  ) {
    const session = await this.getActiveSession(userId, sessionId);
    if (session.finishedAt) throw new BadRequestException('Session terminée');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const questionId = session.questionIds[session.currentIndex];
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException();

    if (type === 'fifty_fifty') {
      if (session.jokerFiftyUsed) throw new BadRequestException('Joker déjà utilisé');
      if (user.jokerFiftyFifty < 1) throw new BadRequestException('Aucun joker 50/50');
      const wrong = (['A', 'B', 'C', 'D'] as AnswerKey[]).filter((k) => k !== question.correctAnswer);
      const eliminated = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
      await this.prisma.quizSession.update({
        where: { id: sessionId },
        data: { jokerFiftyUsed: true },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { jokerFiftyFifty: { decrement: 1 } },
      });
      return { type, eliminatedKeys: eliminated, bonusSeconds: 0 };
    }

    if (type === 'time_bonus') {
      if (session.jokerTimeUsed) throw new BadRequestException('Joker déjà utilisé');
      if (user.jokerTimeBonus < 1) throw new BadRequestException('Aucun joker +5s');
      await this.prisma.quizSession.update({
        where: { id: sessionId },
        data: { jokerTimeUsed: true },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { jokerTimeBonus: { decrement: 1 } },
      });
      return { type, eliminatedKeys: [], bonusSeconds: JOKER_BONUS_SECONDS };
    }

    if (session.jokerCommunityUsed) throw new BadRequestException('Joker déjà utilisé');
    if (user.jokerCommunity < 1) throw new BadRequestException('Aucun joker communauté');

    const total =
      question.answerACount +
      question.answerBCount +
      question.answerCCount +
      question.answerDCount;

    let communityPercents: Partial<Record<AnswerKey, number>>;
    if (total < 5) {
      // Soft defaults when little data
      communityPercents = { A: 40, B: 25, C: 20, D: 15 };
      const correct = question.correctAnswer as AnswerKey;
      communityPercents = { A: 15, B: 15, C: 15, D: 15, [correct]: 55 };
    } else {
      communityPercents = {
        A: Math.round((question.answerACount / total) * 100),
        B: Math.round((question.answerBCount / total) * 100),
        C: Math.round((question.answerCCount / total) * 100),
        D: Math.round((question.answerDCount / total) * 100),
      };
    }

    await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: { jokerCommunityUsed: true },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { jokerCommunity: { decrement: 1 } },
    });

    return { type, communityPercents, bonusSeconds: 0 };
  }

  private async finishSession(userId: string, sessionId: string): Promise<SessionResultDto> {
    const session = await this.getActiveSession(userId, sessionId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const perfect = isPerfectCombo(session.maxCombo) && session.correctCount === QUESTIONS_PER_SESSION;
    const xpGained = sessionXp(session.correctCount, session.maxCombo, perfect);
    const gemsGained = perfect ? 25 : session.correctCount >= 7 ? 10 : 5;

    const { level, xp, leveledUp } = addXp(user.level, user.xp, xpGained);

    const last = user.lastPlayed;
    const today = new Date();
    const sameDay =
      last &&
      last.toDateString() === today.toDateString();
    const yesterday =
      last &&
      new Date(today.getTime() - 86400000).toDateString() === last.toDateString();
    const streak = sameDay ? user.streak : yesterday ? user.streak + 1 : 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        level,
        xp,
        gems: { increment: gemsGained },
        streak,
        lastPlayed: today,
      },
    });

    await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        finishedAt: new Date(),
        xpGained,
        gemsGained,
      },
    });

    await this.leaderboard.submitScore(userId, session.score);
    await this.missions.progressAfterSolo(userId, session.correctCount, perfect);

    const percentBeaten = await this.leaderboard.percentBeaten(userId, session.score);

    return {
      sessionId,
      score: session.score,
      maxCombo: session.maxCombo,
      correctCount: session.correctCount,
      totalQuestions: QUESTIONS_PER_SESSION,
      xpGained,
      gemsGained,
      percentBeaten,
      leveledUp,
      level,
      perfect,
    };
  }

  async createFriendChallenge(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      include: { category: true, user: { select: { username: true } } },
    });
    if (!session?.finishedAt) {
      throw new BadRequestException('Termine d’abord la partie Solo');
    }

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 3600_000);
    const challenge = await this.prisma.friendChallenge.create({
      data: {
        code,
        creatorId: userId,
        categoryId: session.categoryId,
        questionIds: session.questionIds,
        creatorScore: session.score,
        creatorCorrect: session.correctCount,
        creatorMaxCombo: session.maxCombo,
        creatorSessionId: session.id,
        expiresAt,
        status: 'open',
      },
    });

    return {
      code: challenge.code,
      expiresAt: challenge.expiresAt,
      creatorScore: challenge.creatorScore,
      categoryName: session.category.name,
      creatorUsername: session.user.username,
    };
  }

  async getFriendChallenge(code: string) {
    const challenge = await this.prisma.friendChallenge.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: { select: { username: true } },
      },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable');

    const category = await this.prisma.category.findUnique({ where: { id: challenge.categoryId } });
    const expired = challenge.expiresAt < new Date();
    const status = expired && challenge.status === 'open' ? 'expired' : challenge.status;

    return {
      code: challenge.code,
      status,
      creatorUsername: challenge.creator.username,
      creatorScore: challenge.creatorScore,
      categoryName: category?.name ?? 'Quiz',
      expiresAt: challenge.expiresAt,
      challengerScore: challenge.challengerScore,
    };
  }

  async startFriendChallenge(userId: string, code: string) {
    const challenge = await this.prisma.friendChallenge.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable');
    if (challenge.status !== 'open' || challenge.expiresAt < new Date()) {
      throw new BadRequestException('Défi expiré ou terminé');
    }
    if (challenge.creatorId === userId) {
      throw new BadRequestException('Tu ne peux pas relever ton propre défi');
    }

    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        categoryId: challenge.categoryId,
        mode: 'challenge_friend',
        questionIds: challenge.questionIds,
      },
    });

    await this.prisma.friendChallenge.update({
      where: { id: challenge.id },
      data: { challengerId: userId, challengerSessionId: session.id },
    });

    const first = await this.getQuestionPublic(challenge.questionIds[0]);
    return {
      sessionId: session.id,
      code: challenge.code,
      questionIndex: 0,
      totalQuestions: challenge.questionIds.length,
      question: first,
      score: 0,
      targetScore: challenge.creatorScore,
    };
  }

  async answerFriendChallenge(
    userId: string,
    code: string,
    sessionId: string,
    answer: AnswerKey,
    timeSpent: number,
  ) {
    const challenge = await this.prisma.friendChallenge.findUnique({
      where: { code: code.toUpperCase() },
      include: { creator: { select: { username: true } } },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable');
    if (challenge.challengerSessionId !== sessionId) {
      throw new BadRequestException('Session défi invalide');
    }

    const result = await this.answer(userId, sessionId, answer, timeSpent);
    if (!result.finished || !result.result) return result;

    const updated = await this.prisma.friendChallenge.update({
      where: { id: challenge.id },
      data: {
        status: 'completed',
        challengerScore: result.result.score,
        challengerCorrect: result.result.correctCount,
        finishedAt: new Date(),
      },
    });

    return {
      ...result,
      challengeResult: {
        creatorUsername: challenge.creator.username,
        creatorScore: challenge.creatorScore,
        challengerScore: updated.challengerScore,
        won: (updated.challengerScore ?? 0) > challenge.creatorScore,
        draw: updated.challengerScore === challenge.creatorScore,
      },
    };
  }

  async getQuestionPublic(id: string): Promise<QuestionPublicDto> {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Question introuvable');
    return {
      id: q.id,
      text: q.text,
      answers: [
        { key: 'A', text: q.answerA },
        { key: 'B', text: q.answerB },
        { key: 'C', text: q.answerC },
        { key: 'D', text: q.answerD },
      ],
      timeLimit: QUESTION_TIME_SECONDS,
      explanation: q.explanation ?? undefined,
    };
  }

  private async getActiveSession(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session introuvable');
    return session;
  }

  /** V1 hooks */
  challengeFriendStub() {
    return {
      available: true,
      message: 'Crée un défi depuis l’écran résultats, ou ouvre /challenge?code=XXXX',
    };
  }

  thematicStub() {
    return {
      available: false,
      message: 'Mode Thématique — prévu V1.1',
    };
  }
}
