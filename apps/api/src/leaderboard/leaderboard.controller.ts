import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  async list(@Query('type') type?: string, @Query('limit') limit?: string) {
    const t = type === 'weekly' ? 'weekly' : 'global';
    const lim = Math.min(Number(limit ?? 50) || 50, 100);
    return this.leaderboard.getBoard(t, lim);
  }
}
