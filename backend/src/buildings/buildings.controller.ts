import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { UpdatePositionDto, UpdateBuildingStateDto } from './dto/update-building.dto';
import { CreateBuildingDto } from './dto/create-building.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('buildings')
@UseGuards(JwtAuthGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.buildingsService.findAll(user.userId);
  }

  @Get('catalog')
  catalog() {
    return this.buildingsService.getCatalog();
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBuildingDto,
  ) {
    return this.buildingsService.create(user.userId, dto);
  }

  @Patch(':id/position')
  updatePosition(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.buildingsService.updatePosition(user.userId, id, dto.x, dto.y);
  }

  @Patch(':id/state')
  updateState(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBuildingStateDto,
  ) {
    return this.buildingsService.setState(user.userId, id, dto.state);
  }

  @Patch(':id/upgrade')
  upgrade(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.buildingsService.upgrade(user.userId, id);
  }

  @Patch(':id/expand')
  expand(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.buildingsService.expand(user.userId, id);
  }
}
