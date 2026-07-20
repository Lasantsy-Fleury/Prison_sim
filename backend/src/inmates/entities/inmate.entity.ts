import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InmateStatus {
  ACTIVE = 'ACTIVE',
  ESCAPED = 'ESCAPED',
  TRANSFERRED = 'TRANSFERRED',
  RELEASED = 'RELEASED',
}

@Entity('inmates')
export class Inmate {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column()
  name: string;

  @Column({ default: 30 })
  age: number;

  /** 0-100 : capacité d'organisation, d'évasion, de manipulation */
  @Column({ default: 50 })
  intelligence: number;

  /** 0-100 : soumission / docilité (faible = dangereux) */
  @Column({ default: 50 })
  fear: number;

  /** 0-100 : propension à la violence */
  @Column({ default: 50 })
  aggressiveness: number;

  /** 0-100 : moral / satisfaction */
  @Column({ default: 50 })
  morale: number;

  /** Score de comportement global 0-100 (calculé par le moteur) */
  @Column({ default: 50 })
  behaviorScore: number;

  /** Bloc / cellule (ex: "A1") */
  @Column({ default: 'A1' })
  block: string;

  @Column({ type: 'varchar', default: InmateStatus.ACTIVE })
  status: InmateStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
