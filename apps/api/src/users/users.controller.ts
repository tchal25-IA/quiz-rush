import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';

class RefillJokerDto {
  @IsIn(['fifty_fifty', 'time_bonus', 'community'])
  type!: 'fifty_fifty' | 'time_bonus' | 'community';

  @IsIn(['ad', 'gems'])
  method!: 'ad' | 'gems';
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.users.toPublic(user.userId);
  }

  @Post('jokers/refill')
  refill(@CurrentUser() user: { userId: string }, @Body() dto: RefillJokerDto) {
    return this.users.refillJoker(user.userId, dto.type, dto.method);
  }
}
