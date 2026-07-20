import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventQueryDto } from './dto/event-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getTimeline(@CurrentUser() user: AuthUser, @Query() query: EventQueryDto) {
    return this.eventsService.findTimeline(user.userId, query);
  }

  @Get('series')
  getSeries(@CurrentUser() user: AuthUser) {
    return this.eventsService.aggregateByTypeAndDay(user.userId);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const found = await this.eventsService.findById(user.userId, Number(id));
    if (!found) {
      throw new NotFoundException('Événement introuvable');
    }
    return found;
  }
}
