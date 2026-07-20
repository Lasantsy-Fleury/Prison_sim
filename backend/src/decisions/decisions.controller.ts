import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { DecisionDto } from './dto/decision.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('decisions')
@UseGuards(JwtAuthGuard)
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post()
  apply(@CurrentUser() user: AuthUser, @Body() dto: DecisionDto) {
    return this.decisionsService.apply(user.userId, dto);
  }
}
