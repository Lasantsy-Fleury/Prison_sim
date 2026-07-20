import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { InmatesModule } from './inmates/inmates.module';
import { EventsModule } from './events/events.module';
import { PrisonModule } from './prison/prison.module';
import { SimulationModule } from './simulation/simulation.module';
import { StatsModule } from './stats/stats.module';
import { DecisionsModule } from './decisions/decisions.module';
import { BuildingsModule } from './buildings/buildings.module';
import { GuardsModule } from './guards/guards.module';
import { EconomyModule } from './economy/economy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'prison_sim'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: false,
      }),
    }),
    AuthModule,
    InmatesModule,
    EventsModule,
    PrisonModule,
    SimulationModule,
    StatsModule,
    DecisionsModule,
    BuildingsModule,
    GuardsModule,
    EconomyModule,
  ],
})
export class AppModule {}
