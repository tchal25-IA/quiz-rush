import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DuelService } from './duel.service';
import { DuelGateway } from './duel.gateway';
import { DuelController } from './duel.controller';
import { QuizModule } from '../quiz/quiz.module';

@Module({
  imports: [
    QuizModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'quiz-rush-dev-secret'),
      }),
    }),
  ],
  providers: [DuelService, DuelGateway],
  controllers: [DuelController],
  exports: [DuelService],
})
export class DuelModule {}
