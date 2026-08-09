import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { QuizService } from './quiz.service';
import type { AnswerKey } from '@quiz-rush/shared';

class StartSoloDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}

class AnswerDto {
  @IsIn(['A', 'B', 'C', 'D'])
  answer!: AnswerKey;

  @IsInt()
  @Min(0)
  @Max(60)
  timeSpent!: number;
}

class JokerDto {
  @IsIn(['fifty_fifty', 'time_bonus', 'community'])
  type!: 'fifty_fifty' | 'time_bonus' | 'community';
}

class CreateChallengeDto {
  @IsString()
  sessionId!: string;
}

class ChallengeAnswerDto {
  @IsString()
  sessionId!: string;

  @IsIn(['A', 'B', 'C', 'D'])
  answer!: AnswerKey;

  @IsInt()
  @Min(0)
  @Max(60)
  timeSpent!: number;
}

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Get('categories')
  categories() {
    return this.quiz.listCategories();
  }

  @Post('solo/start')
  start(@CurrentUser() user: { userId: string }, @Body() dto: StartSoloDto) {
    return this.quiz.startSolo(user.userId, dto.categoryId);
  }

  @Get('solo/:sessionId')
  current(@CurrentUser() user: { userId: string }, @Param('sessionId') sessionId: string) {
    return this.quiz.getCurrentQuestion(user.userId, sessionId);
  }

  @Post('solo/:sessionId/answer')
  answer(
    @CurrentUser() user: { userId: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: AnswerDto,
  ) {
    return this.quiz.answer(user.userId, sessionId, dto.answer, dto.timeSpent);
  }

  @Post('solo/:sessionId/joker')
  joker(
    @CurrentUser() user: { userId: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: JokerDto,
  ) {
    return this.quiz.useJoker(user.userId, sessionId, dto.type);
  }

  @Post('challenge')
  createChallenge(@CurrentUser() user: { userId: string }, @Body() dto: CreateChallengeDto) {
    return this.quiz.createFriendChallenge(user.userId, dto.sessionId);
  }

  @Get('challenge/:code')
  getChallenge(@Param('code') code: string) {
    return this.quiz.getFriendChallenge(code);
  }

  @Post('challenge/:code/start')
  startChallenge(@CurrentUser() user: { userId: string }, @Param('code') code: string) {
    return this.quiz.startFriendChallenge(user.userId, code);
  }

  @Post('challenge/:code/answer')
  answerChallenge(
    @CurrentUser() user: { userId: string },
    @Param('code') code: string,
    @Body() dto: ChallengeAnswerDto,
  ) {
    return this.quiz.answerFriendChallenge(user.userId, code, dto.sessionId, dto.answer, dto.timeSpent);
  }

  @Get('hooks/challenge-friend')
  challengeHook() {
    return this.quiz.challengeFriendStub();
  }

  @Get('hooks/thematic')
  thematicHook() {
    return this.quiz.thematicStub();
  }
}
