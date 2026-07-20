import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BuildingType {
  CELL_BLOCK = 'CELL_BLOCK',
  CORRIDOR = 'CORRIDOR',
  YARD = 'YARD',
  CANTEEN = 'CANTEEN',
  INFIRMARY = 'INFIRMARY',
  SECURITY = 'SECURITY',
  VISITING = 'VISITING',
  WORKSHOP = 'WORKSHOP',
  DOOR = 'DOOR',
  CAMERA = 'CAMERA',
  FENCE = 'FENCE',
  BARBED_WIRE = 'BARBED_WIRE',
  GUARD_POST = 'GUARD_POST',
}

export enum BuildingCategory {
  ROOM = 'room',
  INSTALLATION = 'installation',
}

export enum BuildingState {
  OPERATIONAL = 'OPERATIONAL',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  DAMAGED = 'DAMAGED',
  OFFLINE = 'OFFLINE',
}

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 24 })
  type: BuildingType;

  @Column({ type: 'varchar', length: 12, default: BuildingCategory.ROOM })
  category: BuildingCategory;

  @Column()
  name: string;

  /** Coordonnées logiques dans la grille de la carte (espace 1000x640). */
  @Column({ default: 0 })
  x: number;

  @Column({ default: 0 })
  y: number;

  @Column({ default: 60 })
  w: number;

  @Column({ default: 40 })
  h: number;

  /** Niveau d'amélioration (0 = de base). */
  @Column({ default: 0 })
  level: number;

  /** Capacité (ex : nb de places pour une cellule, postes pour la sécurité). */
  @Column({ default: 0 })
  capacity: number;

  @Column({ type: 'varchar', length: 24, default: BuildingState.OPERATIONAL })
  state: BuildingState;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
