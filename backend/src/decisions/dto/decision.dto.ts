import { IsIn, IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';

export enum DecisionType {
  INCREASE_SECURITY = 'INCREASE_SECURITY',
  MOVE_INMATE = 'MOVE_INMATE',
  SANCTION = 'SANCTION',
  REWARD = 'REWARD',
  RELEASE = 'RELEASE',
}

export class DecisionDto {
  @IsIn(Object.values(DecisionType))
  type: DecisionType;

  /** Requis pour MOVE_INMATE, SANCTION, REWARD, RELEASE */
  @IsOptional()
  @IsInt()
  @Min(1)
  inmateId?: number;

  /** Requis pour MOVE_INMATE */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  block?: string;

  /** Montant pour INCREASE_SECURITY (points de sécurité) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  amount?: number;
}
