import { Controller, Get, UseGuards } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('economy')
@UseGuards(JwtAuthGuard)
export class EconomyController {
  constructor(private readonly economyService: EconomyService) {}

  /** Bilan financier complet : budget + revenus/dépenses détaillés. */
  @Get()
  async get(@CurrentUser() user: AuthUser) {
    const state = await this.economyService.getBreakdown(user.userId);
    return state;
  }
}
