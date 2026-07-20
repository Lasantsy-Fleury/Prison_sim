import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrisonState } from './entities/prison-state.entity';
import { PrisonService } from './prison.service';
import { PrisonController } from './prison.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrisonState])],
  providers: [PrisonService],
  controllers: [PrisonController],
  exports: [PrisonService],
})
export class PrisonModule {}
