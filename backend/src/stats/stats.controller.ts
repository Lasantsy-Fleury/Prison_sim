import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.statsService.getDashboard(user.userId);
  }

  @Get()
  getStats(@CurrentUser() user: AuthUser) {
    return this.statsService.getStats(user.userId);
  }
}
