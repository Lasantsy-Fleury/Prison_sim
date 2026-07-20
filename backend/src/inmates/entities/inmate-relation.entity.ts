import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum RelationType {
  ALLY = 'ALLY',
  ENEMY = 'ENEMY',
  NEUTRAL = 'NEUTRAL',
}

/**
 * Relation dirigée entre deux détenus du même directeur.
 * strength : -100 (ennemi mortel) .. +100 (allié fidèle)
 */
@Entity('inmate_relations')
@Unique(['inmateAId', 'inmateBId'])
export class InmateRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Index()
  @Column()
  inmateAId: number;

  @Index()
  @Column()
  inmateBId: number;

  @Column({ type: 'varchar', default: RelationType.NEUTRAL })
  type: RelationType;

  @Column({ default: 0 })
  strength: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
