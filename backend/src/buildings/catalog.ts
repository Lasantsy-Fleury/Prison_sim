import { BuildingType, BuildingCategory } from './entities/building.entity';

/** Dimensions logiques de la carte (espace 1000x640). */
export const MAP_W = 1000;
export const MAP_H = 640;

export interface BuildSpec {
  type: BuildingType;
  category: BuildingCategory;
  /** Libellé par défaut affiché au joueur. */
  label: string;
  /** Taille par défaut posée sur la carte (espace logique). */
  w: number;
  h: number;
  /** Capacité par défaut (0 pour les installations sans capacité). */
  capacity: number;
  /** Coût de construction immédiatement déduit du budget. */
  buildCost: number;
}

/**
 * Catalogue des bâtiments constructibles. Sert de source de vérité pour les
 * coûts et les tailles par défaut, partagé par le backend (création) et
 * exposé au frontend via GET /buildings/catalog.
 */
export const BUILD_CATALOG: BuildSpec[] = [
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, label: 'Bloc cellulaire', w: 150, h: 120, capacity: 12, buildCost: 320 },
  { type: BuildingType.CORRIDOR, category: BuildingCategory.ROOM, label: 'Couloir', w: 40, h: 200, capacity: 0, buildCost: 60 },
  { type: BuildingType.YARD, category: BuildingCategory.ROOM, label: 'Cour de promenade', w: 200, h: 110, capacity: 200, buildCost: 240 },
  { type: BuildingType.CANTEEN, category: BuildingCategory.ROOM, label: 'Cantine', w: 180, h: 110, capacity: 150, buildCost: 260 },
  { type: BuildingType.INFIRMARY, category: BuildingCategory.ROOM, label: 'Infirmerie', w: 190, h: 120, capacity: 20, buildCost: 280 },
  { type: BuildingType.SECURITY, category: BuildingCategory.ROOM, label: 'Salle de sécurité', w: 190, h: 120, capacity: 8, buildCost: 300 },
  { type: BuildingType.VISITING, category: BuildingCategory.ROOM, label: 'Parloir', w: 190, h: 120, capacity: 16, buildCost: 220 },
  { type: BuildingType.WORKSHOP, category: BuildingCategory.ROOM, label: 'Ateliers', w: 180, h: 110, capacity: 120, buildCost: 300 },
  { type: BuildingType.DOOR, category: BuildingCategory.INSTALLATION, label: 'Portail', w: 44, h: 22, capacity: 0, buildCost: 120 },
  { type: BuildingType.CAMERA, category: BuildingCategory.INSTALLATION, label: 'Caméra', w: 30, h: 30, capacity: 0, buildCost: 90 },
  { type: BuildingType.FENCE, category: BuildingCategory.INSTALLATION, label: 'Clôture', w: 200, h: 16, capacity: 0, buildCost: 70 },
  { type: BuildingType.BARBED_WIRE, category: BuildingCategory.INSTALLATION, label: 'Fil barbelé', w: 200, h: 14, capacity: 0, buildCost: 60 },
  { type: BuildingType.GUARD_POST, category: BuildingCategory.INSTALLATION, label: 'Poste de garde', w: 44, h: 44, capacity: 2, buildCost: 150 },
];

/** Coût de maintenance journalière (€/jour) par type de bâtiment. */
export const MAINTENANCE_COST: Record<string, number> = {
  CELL_BLOCK: 12,
  CORRIDOR: 2,
  YARD: 8,
  CANTEEN: 10,
  INFIRMARY: 9,
  SECURITY: 14,
  VISITING: 6,
  WORKSHOP: 11,
  GUARD_POST: 5,
  CAMERA: 3,
  FENCE: 4,
  BARBED_WIRE: 3,
  DOOR: 2,
};

export function buildSpecFor(type: BuildingType): BuildSpec | undefined {
  return BUILD_CATALOG.find((s) => s.type === type);
}
