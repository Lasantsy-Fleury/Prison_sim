import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InmatesService } from './inmates.service';
import { CreateInmateDto, SeedInmatesDto, InmateQueryDto } from './dto/inmate.dto';
import { PrisonService } from '../prison/prison.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('inmates')
@UseGuards(JwtAuthGuard)
export class InmatesController {
  constructor(
    private readonly inmatesService: InmatesService,
    private readonly prisonService: PrisonService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateInmateDto) {
    const state = await this.prisonService.getOrCreate(user.userId);
    return this.inmatesService.create(user.userId, dto, state.currentDay);
  }

  @Post('seed')
  async seed(@CurrentUser() user: AuthUser, @Body() dto: SeedInmatesDto) {
    const state = await this.prisonService.getOrCreate(user.userId);
    return this.inmatesService.seed(user.userId, dto, state.currentDay);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: InmateQueryDto) {
    return this.inmatesService.findAll(user.userId, query.status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.inmatesService.findOne(user.userId, Number(id));
  }

  @Get(':id/relations')
  getRelations(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.inmatesService.getRelations(user.userId, Number(id));
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.inmatesService.remove(user.userId, Number(id));
  }
}
