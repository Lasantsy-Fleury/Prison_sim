import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PrisonEventType, EventSeverity } from '../enums';

@Entity('prison_events')
export class PrisonEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  /** Jour de simulation auquel l'événement a eu lieu */
  @Index()
  @Column({ default: 0 })
  day: number;

  @Column({ type: 'varchar' })
  type: PrisonEventType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: EventSeverity.LOW })
  severity: EventSeverity;

  /** Détenu principal concerné */
  @Index()
  @Column({ nullable: true })
  inmateId: number | null;

  /** Détenu lié (rival, allié, victime, etc.) */
  @Column({ nullable: true })
  relatedInmateId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
