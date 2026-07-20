import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePrisonDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}
