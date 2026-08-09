import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { MissionsModule } from '../missions/missions.module';

@Module({
  imports: [LeaderboardModule, MissionsModule],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}
