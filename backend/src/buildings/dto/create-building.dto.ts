import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { BuildingType } from '../entities/building.entity';
import { MAP_W, MAP_H } from '../catalog';

export class CreateBuildingDto {
  @IsIn(Object.values(BuildingType))
  type: BuildingType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @IsInt()
  @Min(0)
  @Max(MAP_W)
  x: number;

  @IsInt()
  @Min(0)
  @Max(MAP_H)
  y: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(MAP_W)
  w?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(MAP_H)
  h?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  capacity?: number;
}
