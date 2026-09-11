import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuizModule } from './quiz/quiz.module';
import { DuelModule } from './duel/duel.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { MissionsModule } from './missions/missions.module';
import { SeedModule } from './seed/seed.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DailyChallengeModule } from './daily-challenge/daily-challenge.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    QuizModule,
    DuelModule,
    LeaderboardModule,
    MissionsModule,
    SeedModule,
    AnalyticsModule,
    DailyChallengeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
