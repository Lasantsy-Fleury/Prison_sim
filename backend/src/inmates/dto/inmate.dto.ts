import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateInmateDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(16)
  @Max(95)
  age?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  intelligence?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  fear?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  aggressiveness?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  morale?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  block?: string;
}

export class SeedInmatesDto {
  @IsInt()
  @Min(1)
  @Max(40)
  count: number;

  /** Bloc de destination optionnel */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  block?: string;
}

export class InmateQueryDto {
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';
}
