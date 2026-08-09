import { BadRequestException, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MissionsService } from './missions.service';

@Controller('missions')
@UseGuards(JwtAuthGuard)
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.missions.listForUser(user.userId);
  }

  @Post(':id/claim')
  claim(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.missions.claim(user.userId, id);
  }
}
