import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PrisonService } from './prison.service';
import { UpdatePrisonDto } from './dto/update-prison.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('prison')
@UseGuards(JwtAuthGuard)
export class PrisonController {
  constructor(private readonly prisonService: PrisonService) {}

  @Get('state')
  getState(@CurrentUser() user: AuthUser) {
    return this.prisonService.getOrCreate(user.userId);
  }

  @Patch('state')
  updateState(@CurrentUser() user: AuthUser, @Body() dto: UpdatePrisonDto) {
    return this.prisonService.update(user.userId, { name: dto.name });
  }
}
