import { IsIn, IsInt, Max, Min } from 'class-validator';
import { BuildingState } from '../entities/building.entity';

export class UpdatePositionDto {
  @IsInt()
  @Min(0)
  @Max(1000)
  x: number;

  @IsInt()
  @Min(0)
  @Max(640)
  y: number;
}

export class UpdateBuildingStateDto {
  @IsIn(Object.values(BuildingState))
  state: BuildingState;
}
