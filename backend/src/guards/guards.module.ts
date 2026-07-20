import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guard } from './entities/guard.entity';
import { GuardsService } from './guards.service';
import { GuardsController } from './guards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Guard])],
  providers: [GuardsService],
  controllers: [GuardsController],
  exports: [GuardsService],
})
export class GuardsModule {}
