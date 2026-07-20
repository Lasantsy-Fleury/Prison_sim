import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('prison_state')
export class PrisonState {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  userId: number;

  @Column({ default: 'Centrale de Sang-Vin' })
  name: string;

  /** Compteur de jours de simulation */
  @Column({ default: 0 })
  currentDay: number;

  /** Niveau de sécurité global 0-100 */
  @Column({ default: 50 })
  securityLevel: number;

  /** Budget disponible pour les décisions du directeur */
  @Column({ default: 1000 })
  budget: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
