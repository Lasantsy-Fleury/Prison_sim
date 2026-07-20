import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('economy_state')
export class EconomyState {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  userId: number;

  /** Wallet autoritatif du jeu (seedé depuis prison_state.budget). */
  @Column({ default: 1000 })
  budget: number;

  /** Revenus journaliers estimés (cotisations, subventions). */
  @Column({ default: 200 })
  dailyRevenue: number;

  /** Dépenses journalières (salaires + maintenance). */
  @Column({ default: 120 })
  dailyExpenses: number;

  /** Dernier jour de simulation soldé. */
  @Column({ default: 0 })
  lastSettledDay: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
