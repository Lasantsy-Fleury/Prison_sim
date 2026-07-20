import { Controller, Get, UseGuards } from '@nestjs/common';
import { GuardsService } from './guards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('guards')
@UseGuards(JwtAuthGuard)
export class GuardsController {
  constructor(private readonly guardsService: GuardsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.guardsService.findAll(user.userId);
  }
}
