import { Module } from '@nestjs/common';
import { SimulationEngine } from './engine/simulation.engine';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { InmatesModule } from '../inmates/inmates.module';
import { EventsModule } from '../events/events.module';
import { PrisonModule } from '../prison/prison.module';
import { EconomyModule } from '../economy/economy.module';
import { BuildingsModule } from '../buildings/buildings.module';

@Module({
  imports: [InmatesModule, EventsModule, PrisonModule, EconomyModule, BuildingsModule],
  providers: [SimulationEngine, SimulationService],
  controllers: [SimulationController],
  exports: [SimulationService],
})
export class SimulationModule {}
