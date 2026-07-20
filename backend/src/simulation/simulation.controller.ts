import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { AdvanceDayDto } from './dto/advance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('advance')
  advance(@CurrentUser() user: AuthUser, @Body() dto: AdvanceDayDto) {
    return this.simulationService.advanceDays(user.userId, dto.days ?? 1);
  }
}
