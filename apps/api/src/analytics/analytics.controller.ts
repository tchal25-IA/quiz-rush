import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { AnalyticsService } from './analytics.service';

class AnalyticsEventDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  ts?: string;
}

class TrackDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventDto)
  events!: AnalyticsEventDto[];
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  @UseGuards(OptionalJwtAuthGuard)
  track(@Req() req: { user?: { userId: string } }, @Body() dto: TrackDto) {
    return this.analytics.trackMany(req.user?.userId, dto.events ?? []);
  }

  @Get('funnel')
  funnel() {
    return this.analytics.funnelSummary();
  }
}
