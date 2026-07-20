import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './entities/building.entity';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { PrisonModule } from '../prison/prison.module';

@Module({
  imports: [TypeOrmModule.forFeature([Building]), PrisonModule],
  providers: [BuildingsService],
  controllers: [BuildingsController],
  exports: [BuildingsService],
})
export class BuildingsModule {}
