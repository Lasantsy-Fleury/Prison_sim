import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';
import { PrisonEventType } from '../enums';

export class EventQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(Object.values(PrisonEventType))
  type?: PrisonEventType;

  @IsOptional()
  @IsInt()
  @Min(0)
  day?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  inmateId?: number;

  @IsOptional()
  @IsString()
  sort?: 'DESC' | 'ASC' = 'DESC';
}
