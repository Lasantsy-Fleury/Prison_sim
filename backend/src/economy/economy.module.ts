import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EconomyState } from './entities/economy-state.entity';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';
import { PrisonModule } from '../prison/prison.module';
import { GuardsModule } from '../guards/guards.module';
import { BuildingsModule } from '../buildings/buildings.module';
import { InmatesModule } from '../inmates/inmates.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EconomyState]),
    PrisonModule,
    GuardsModule,
    BuildingsModule,
    InmatesModule,
    EventsModule,
  ],
  providers: [EconomyService],
  controllers: [EconomyController],
  exports: [EconomyService],
})
export class EconomyModule {}
