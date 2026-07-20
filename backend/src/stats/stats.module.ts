import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { InmatesModule } from '../inmates/inmates.module';
import { EventsModule } from '../events/events.module';
import { PrisonModule } from '../prison/prison.module';

@Module({
  imports: [InmatesModule, EventsModule, PrisonModule],
  providers: [StatsService],
  controllers: [StatsController],
  exports: [StatsService],
})
export class StatsModule {}
