import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inmate } from './entities/inmate.entity';
import { InmateRelation } from './entities/inmate-relation.entity';
import { InmatesService } from './inmates.service';
import { InmatesController } from './inmates.controller';
import { EventsModule } from '../events/events.module';
import { PrisonModule } from '../prison/prison.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inmate, InmateRelation]),
    EventsModule,
    PrisonModule,
  ],
  providers: [InmatesService],
  controllers: [InmatesController],
  exports: [InmatesService],
})
export class InmatesModule {}
