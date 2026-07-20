import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class AdvanceDayDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number = 1;
}
