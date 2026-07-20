// Central mutable world state: entities, buildings, time, social structures,
// event log, notifications and objectives. Systems read/write through this.

import type { Entity, BuildingLike, ScheduleActivity } from './types';
import { Grid } from './Grid';
import { SpatialHash } from '../core/SpatialHash';
import { Rng } from '../core/Rng';
import { OBJECTIVES } from '../data/presets';
import { dist2 } from '../core/MathUtils';

export interface LogEntry {
  id: number;
  t: number;
  level: 'info' | 'warn' | 'critical';
  text: string;
  icon?: string;
}

export interface Notification {
  id: number;
  text: string;
  kind: 'info' | 'warn' | 'critical' | 'good';
  t: number;
}

export interface ObjectiveState {
  id: string;
  title: string;
  desc: string;
  target: number;
  value: number;
  done: boolean;
}

export interface WorldTime {
  day: number;
  hour: number; // 0..24 float
  minute: number;
  simTime: number; // seconds since engine start
  dayLength: number; // seconds per in-game day at 1x
}

const START_HOUR = 6;

export class World {
  entities = new Map<number, Entity>();
  buildings: BuildingLike[] = [];
  grid: Grid;
  spatial = new SpatialHash(48);
  rng: Rng;
  time: WorldTime;
  selectedId: number | null = null;
  gangs = new Map<string, Set<number>>();

  log: LogEntry[] = [];
  notifications: Notification[] = [];
  objectives: ObjectiveState[] = [];
  weather = 'clear' as 'clear' | 'rain' | 'fog';

  private logId = 1;
  private notifId = 1;

  constructor(seed = 1337, worldW = 1000, worldH = 640) {
    this.grid = new Grid(worldW, worldH);
    this.rng = new Rng(seed);
    this.time = {
      day: 1,
      hour: START_HOUR,
      minute: 0,
      simTime: (START_HOUR / 24) * 144,
      dayLength: 144,
    };
    this.objectives = OBJECTIVES.map((o) => ({ ...o, value: 0, done: false }));
  }

  // ---- time ----
  advance(dt: number) {
    const t = this.time;
    t.simTime += dt;
    const dayStart = t.dayLength;
    const totalDays = t.simTime / dayStart;
    t.day = Math.floor(totalDays) + 1;
    const frac = (totalDays - Math.floor(totalDays)) * 24;
    t.hour = frac;
    t.minute = (frac % 1) * 60;
  }

  // ---- entities ----
  add(e: Entity): Entity {
    this.entities.set(e.id, e);
    return e;
  }

  remove(id: number): Entity | undefined {
    const e = this.entities.get(id);
    if (e) this.entities.delete(id);
    return e;
  }

  get(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  all(): Entity[] {
    return Array.from(this.entities.values());
  }

  list(kind?: Entity['kind']): Entity[] {
    if (!kind) return this.all();
    return this.all().filter((e) => e.kind === kind);
  }

  count(kind?: Entity['kind']): number {
    if (!kind) return this.entities.size;
    let n = 0;
    for (const e of this.entities.values()) if (e.kind === kind) n++;
    return n;
  }

  rebuildSpatial() {
    this.spatial.clear();
    for (const e of this.entities.values()) {
      this.spatial.insert({ x: e.x, y: e.y, id: e.id });
    }
  }

  nearby(x: number, y: number, radius: number, kind?: Entity['kind']): Entity[] {
    const ids = this.spatial.queryIds(x, y, radius);
    const out: Entity[] = [];
    for (const id of ids) {
      const e = this.entities.get(id);
      if (e && (!kind || e.kind === kind)) out.push(e);
    }
    return out;
  }

  // ---- buildings ----
  setBuildings(list: BuildingLike[]) {
    this.buildings = list;
    this.grid.rebuild(list);
  }

  addBuilding(b: BuildingLike) {
    this.buildings.push(b);
    this.grid.rebuild(this.buildings);
  }

  byType(type: string): BuildingLike[] {
    return this.buildings.filter((b) => b.type === type && b.category === 'room' && b.state === 'OPERATIONAL');
  }

  findNearestBuilding(x: number, y: number, types: string[]): BuildingLike | null {
    let best: BuildingLike | null = null;
    let bestD = Infinity;
    for (const b of this.buildings) {
      if (b.category !== 'room' || b.state !== 'OPERATIONAL') continue;
      if (!types.includes(b.type)) continue;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const d = dist2(x, y, cx, cy);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  buildingCenter(b: BuildingLike): { x: number; y: number } {
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }

  // ---- log / notifications ----
  log_(level: LogEntry['level'], text: string, icon?: string) {
    this.log.push({ id: this.logId++, t: this.time.simTime, level, text, icon });
    if (this.log.length > 200) this.log.shift();
  }

  notify(text: string, kind: Notification['kind'] = 'info') {
    this.notifications.push({ id: this.notifId++, text, kind, t: this.time.simTime });
    if (this.notifications.length > 60) this.notifications.shift();
  }

  // ---- gangs ----
  addToGang(name: string, id: number) {
    let set = this.gangs.get(name);
    if (!set) {
      set = new Set();
      this.gangs.set(name, set);
    }
    set.add(id);
  }

  gangOf(id: number): string | null {
    for (const [name, set] of this.gangs) if (set.has(id)) return name;
    return null;
  }

  /** Average mood (0..100) of active inmates — feeds the HUD satisfaction. */
  averageMood(): number {
    let sum = 0;
    let n = 0;
    for (const e of this.entities.values()) {
      if (e.kind !== 'inmate') continue;
      sum += e.mood;
      n++;
    }
    return n ? Math.round(sum / n) : 50;
  }
}
