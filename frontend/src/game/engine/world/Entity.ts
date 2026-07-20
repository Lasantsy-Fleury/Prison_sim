// Entity factory. Builds fully-formed simulation agents from minimal input.

import type {
  Entity, EntityKind, Appearance, Traits, Psychology, Needs, Inventory, ScheduleEntry,
} from './types';
import { Rng } from '../core/Rng';
import { randomAppearance, appearanceKey } from '../sprites/appearance';
import {
  FIRST_NAMES, LAST_NAMES, GUARD_NAMES, INMATE_SCHEDULE, GUARD_SCHEDULE, CONTRABAND_ITEMS,
} from '../data/presets';

let _idCounter = 1;
export function nextId(): number {
  return _idCounter++;
}
export function resetIds() {
  _idCounter = 1;
}

function randomTraits(rng: Rng): Traits {
  return {
    intelligence: rng.int(20, 95),
    fear: rng.int(10, 90),
    aggressiveness: rng.int(5, 95),
    morale: rng.int(20, 90),
    discipline: rng.int(15, 95),
    empathy: rng.int(10, 95),
    sociability: rng.int(15, 95),
  };
}

function randomPsychology(rng: Rng): Psychology {
  return {
    orientation: rng.pick(['hetero', 'homo', 'bi', 'ace'] as const),
    temperament: rng.pick(['calm', 'choleric', 'melancholic', 'sanguine'] as const),
  };
}

function fullNeeds(rng: Rng): Needs {
  return {
    hunger: rng.int(10, 60),
    fatigue: rng.int(10, 50),
    hygiene: rng.int(10, 55),
    stress: rng.int(10, 45),
    health: 100,
    loneliness: rng.int(10, 50),
    security: rng.int(10, 55),
    freedom: rng.int(40, 90),
    confidence: rng.int(20, 80),
    respect: rng.int(10, 60),
  };
}

function randomInventory(rng: Rng): Inventory {
  const items = [];
  if (rng.chance(0.5)) items.push({ ...CONTRABAND_ITEMS[0], qty: rng.int(1, 3) }); // cig
  if (rng.chance(0.15)) items.push({ ...CONTRABAND_ITEMS[1] }); // phone
  if (rng.chance(0.08)) items.push({ ...CONTRABAND_ITEMS[2] }); // shiv
  if (rng.chance(0.3)) items.push({ ...CONTRABAND_ITEMS[3] }); // meds
  if (rng.chance(0.6)) items.push({ ...CONTRABAND_ITEMS[4], qty: rng.int(5, 80) }); // cash
  return { money: rng.int(0, 50), items };
}

export interface SpawnOptions {
  kind: EntityKind;
  name?: string;
  age?: number;
  appearance?: Appearance;
  traits?: Traits;
  seed: number;
  x: number;
  y: number;
  schedule?: ScheduleEntry[];
  block?: string;
  cellId?: number | null;
  color?: string;
}

export function createEntity(opts: SpawnOptions): Entity {
  const rng = new Rng(opts.seed);
  const appearance = opts.appearance ?? randomAppearance(rng);
  const name =
    opts.name ??
    (opts.kind === 'guard'
      ? rng.pick(GUARD_NAMES)
      : `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`);

  const isGuard = opts.kind === 'guard';

  return {
    id: nextId(),
    kind: opts.kind,
    x: opts.x,
    y: opts.y,
    px: opts.x,
    py: opts.y,
    vx: 0,
    vy: 0,
    facing: rng.chance(0.5) ? 1 : -1,
    speed: isGuard ? 62 : 48,
    path: [],
    pathIndex: 0,
    goal: null,
    goalBuildingId: null,
    recalcAt: 0,
    name,
    age: opts.age ?? rng.int(18, 70),
    appearance,
    appearanceKey: appearanceKey(appearance),
    traits: opts.traits ?? randomTraits(rng),
    psychology: randomPsychology(rng),
    state: 'idle',
    stateUntil: 0,
    animPhase: rng.range(0, 10),
    action: 'idle',
    target: null,
    homeBlock: opts.block ?? 'A',
    cellId: opts.cellId ?? null,
    needs: fullNeeds(rng),
    relations: new Map(),
    gang: isGuard ? null : rng.chance(0.5) ? null : null, // gangs assigned by social system
    reputation: rng.int(-30, 40),
    popularity: rng.int(0, 40),
    influence: rng.int(0, 30),
    inventory: randomInventory(rng),
    bubble: null,
    health: 100,
    stress: rng.int(10, 40),
    mood: rng.int(40, 80),
    arrestTimer: 0,
    fightCooldown: 0,
    bornAt: 0,
    color: opts.color ?? (isGuard ? '#f5c542' : '#5ec8ff'),
  };
}

export function defaultSchedule(kind: EntityKind): ScheduleEntry[] {
  return kind === 'guard' ? GUARD_SCHEDULE.map((s) => ({ ...s })) : INMATE_SCHEDULE.map((s) => ({ ...s }));
}
