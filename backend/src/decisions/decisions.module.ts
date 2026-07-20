import { Module } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';
import { InmatesModule } from '../inmates/inmates.module';
import { PrisonModule } from '../prison/prison.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [InmatesModule, PrisonModule, EventsModule],
  providers: [DecisionsService],
  controllers: [DecisionsController],
  exports: [DecisionsService],
})
export class DecisionsModule {}
