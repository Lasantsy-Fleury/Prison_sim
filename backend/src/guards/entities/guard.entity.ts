import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GuardStatus {
  ON_DUTY = 'ON_DUTY',
  INTERVENING = 'INTERVENING',
  RESTING = 'RESTING',
}

@Entity('guards')
export class Guard {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column()
  name: string;

  /** Position courante dans la grille logique (espace 1000x640). */
  @Column({ default: 0 })
  x: number;

  @Column({ default: 0 })
  y: number;

  /** Bloc assigné (ex: 'A1'). */
  @Column({ type: 'varchar', length: 8, nullable: true })
  assignedBlock: string | null;

  @Column({ default: 80 })
  salary: number;

  /** Compétence 0-100 (interventions plus efficaces). */
  @Column({ default: 50 })
  skill: number;

  @Column({ type: 'varchar', length: 16, default: GuardStatus.ON_DUTY })
  status: GuardStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
