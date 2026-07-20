// Domain types for the simulation world. Kept independent of backend shapes so the
// engine can run as a self-contained real-time layer.

export type EntityKind = 'inmate' | 'guard' | 'visitor' | 'staff';

/** Animation / behaviour states that drive both AI and sprite rendering. */
export type AnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'eat'
  | 'sleep'
  | 'fight'
  | 'talk'
  | 'work'
  | 'panic'
  | 'injured'
  | 'arrested'
  | 'shower'
  | 'escort';

export type GamePhase = 'NUIT' | 'MATIN' | 'JOUR' | 'SOIR';

export type BubbleKind = 'talk' | 'threat' | 'trade' | 'help' | 'fight' | 'thought' | 'heart' | 'angry';

/** Fully customizable physical appearance. MUST stay independent of personality. */
export interface Appearance {
  skin: number; // index into palette
  hairStyle: number; // 0..N
  hairColor: number;
  facialHair: number; // 0 none, 1 mustache, 2 beard, 3 goatee
  glasses: boolean;
  hat: number; // 0 none, 1 cap, 2 beanie, 3 bandana
  tattoo: boolean;
  scar: boolean;
  build: number; // 0 slim, 1 normal, 2 muscular, 3 large
  height: number; // 0 short, 1 normal, 2 tall
  ageLook: number; // 0 young, 1 adult, 2 mature, 3 elder
  clothes: number; // index into clothing palette
  accessory: number; // 0 none, 1 cigarette, 2 phone, 3 earring, 4 necklace
}

export type Trait = 'intelligence' | 'fear' | 'aggressiveness' | 'morale' | 'discipline' | 'empathy' | 'sociability';

export interface Traits {
  intelligence: number; // 0..100
  fear: number; // 0..100
  aggressiveness: number; // 0..100
  morale: number; // 0..100
  discipline: number; // 0..100
  empathy: number; // 0..100
  sociability: number; // 0..100
}

/** Psychological orientations — explicitly NOT derived from appearance. */
export interface Psychology {
  orientation: 'hetero' | 'homo' | 'bi' | 'ace';
  temperament: 'calm' | 'choleric' | 'melancholic' | 'sanguine';
}

export interface Needs {
  hunger: number; // 0 full .. 100 starving
  fatigue: number; // 0 rested .. 100 exhausted
  hygiene: number; // 0 clean .. 100 filthy
  stress: number; // 0 calm .. 100 overwhelmed
  health: number; // 100 healthy .. 0 dead
  loneliness: number; // 0 content .. 100 isolated
  security: number; // 0 safe .. 100 terrified
  freedom: number; // 0 free .. 100 caged
  confidence: number; // 0 meek .. 100 bold
  respect: number; // 0 disrespected .. 100 revered
}

export type RelationType = 'friend' | 'enemy' | 'neutral' | 'rival';

export interface Relation {
  targetId: number;
  type: RelationType;
  strength: number; // -100..100 (neg = enemy)
  trust: number; // 0..100
}

export interface InventoryItem {
  id: string;
  label: string;
  qty: number;
  contraband: boolean;
}

export interface Inventory {
  money: number;
  items: InventoryItem[];
}

export type ScheduleActivity =
  | 'sleep'
  | 'wake'
  | 'breakfast'
  | 'work'
  | 'lunch'
  | 'yard'
  | 'shower'
  | 'workshop'
  | 'dinner'
  | 'cell'
  | 'free'
  | 'medical'
  | 'visit'
  | 'patrol'
  | 'rest';

export interface ScheduleEntry {
  hour: number; // 0..23 start hour
  activity: ScheduleActivity;
  buildingType?: string; // preferred building type for this activity
}

/** A point in the logical world (MAP_W x MAP_H space). */
export interface WorldPoint {
  x: number;
  y: number;
}

export interface Entity {
  id: number;
  kind: EntityKind;
  // transform
  x: number;
  y: number;
  px: number; // previous-frame x (for interpolation)
  py: number;
  vx: number;
  vy: number;
  facing: 1 | -1; // -1 left, 1 right
  speed: number; // base units/sec
  // navigation
  path: WorldPoint[];
  pathIndex: number;
  goal: WorldPoint | null;
  goalBuildingId: number | null;
  recalcAt: number; // sim time at which to recompute path if blocked
  // identity
  name: string;
  age: number;
  appearance: Appearance;
  appearanceKey: string;
  traits: Traits;
  psychology: Psychology;
  // state
  state: AnimState;
  stateUntil: number; // sim time
  animPhase: number; // accumulates for animation cycles
  action: ScheduleActivity | 'idle';
  target: Entity | null; // interaction partner
  homeBlock: string;
  cellId: number | null;
  // social / condition
  needs: Needs;
  relations: Map<number, Relation>;
  gang: string | null;
  reputation: number; // -100..100
  popularity: number; // 0..100
  influence: number; // 0..100
  inventory: Inventory;
  bubble: { kind: BubbleKind; text: string; until: number } | null;
  health: number;
  stress: number;
  mood: number; // 0..100 derived
  arrestTimer: number;
  fightCooldown: number;
  bornAt: number; // sim time
  color: string; // debug / selection tint
}

export interface BuildingLike {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: 'room' | 'installation';
  state: 'OPERATIONAL' | 'UNDER_CONSTRUCTION' | 'DAMAGED' | 'OFFLINE';
  capacity: number;
  level: number;
  doorOpen?: boolean;
  power?: boolean; // lights on
  alarm?: boolean;
  health?: number; // 0..100
}
