import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DuelService } from './duel.service';
import type { AnswerKey } from '@quiz-rush/shared';

class QueueDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}

class AnswerDto {
  @IsInt()
  @Min(0)
  @Max(20)
  questionIndex!: number;

  @IsIn(['A', 'B', 'C', 'D'])
  answer!: AnswerKey;
}

@Controller('duel')
@UseGuards(JwtAuthGuard)
export class DuelController {
  constructor(private readonly duel: DuelService) {}

  @Post('queue')
  queue(@CurrentUser() user: { userId: string }, @Body() dto: QueueDto) {
    return this.duel.enqueue(user.userId, dto.categoryId);
  }

  @Post('practice')
  practice(@CurrentUser() user: { userId: string }, @Body() dto: QueueDto) {
    return this.duel.startPractice(user.userId, dto.categoryId);
  }

  @Post('cancel')
  cancel(@CurrentUser() user: { userId: string }) {
    return this.duel.cancelMatchmaking(user.userId);
  }

  @Post(':id/answer')
  answer(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: AnswerDto,
  ) {
    return this.duel.submitDuelAnswer(user.userId, id, dto.questionIndex, dto.answer);
  }

  @Get(':id')
  get(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.duel.getDuel(id, user.userId);
  }
}
