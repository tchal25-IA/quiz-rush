import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DuelService } from './duel.service';

class QueueDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}

@Controller('duel')
@UseGuards(JwtAuthGuard)
export class DuelController {
  constructor(private readonly duel: DuelService) {}

  @Post('queue')
  queue(@CurrentUser() user: { userId: string }, @Body() dto: QueueDto) {
    return this.duel.enqueue(user.userId, dto.categoryId);
  }

  @Get(':id')
  get(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.duel.getDuel(id, user.userId);
  }

  @Post('cancel')
  cancel(@CurrentUser() user: { userId: string }) {
    return this.duel.cancelMatchmaking(user.userId);
  }
}
