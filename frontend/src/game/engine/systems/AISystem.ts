// Behavioral AI. Each agent decides what to do from its needs, traits, timetable
// and surroundings, then navigates there via the pathfinder. Produces credible
// emergent behaviour: eating when hungry, sleeping when tired, fighting rivals,
// panicking on alarms, guards intervening.

import type { SimContext } from '../core/SimContext';
import type { Entity, BuildingLike, AnimState, ScheduleActivity } from '../world/types';
import { dist, clamp } from '../core/MathUtils';
import { ACTIVITY_BUILDING, INTERACTIONS } from '../data/presets';

const PERFORM: AnimState[] = ['eat', 'sleep', 'shower', 'work', 'fight', 'injured', 'arrested', 'escort'];

const DURATION: Record<string, number> = {
  eat: 12,
  sleep: 22,
  shower: 10,
  work: 24,
};

export class AISystem {
  private nextThink = new Map<number, number>();

  update(ctx: SimContext) {
    const { world, time } = ctx;
    for (const e of world.entities.values()) {
      if (e.kind === 'guard') {
        this.guard(ctx, e);
        continue;
      }
      this.inmate(ctx, e);
    }
  }

  // ---------------- inmates ----------------
  private inmate(ctx: SimContext, e: Entity) {
    const { world, time, dt } = ctx;

    // Continue a locked activity.
    if (PERFORM.includes(e.state) && time < e.stateUntil) {
      this.perform(e, dt, ctx);
      return;
    }
    if (PERFORM.includes(e.state) && time >= e.stateUntil) {
      this.release(e);
    }

    // Panic overrides everything while an alarm is active.
    if (ctx.effects.alarmFlash > 0 && e.state !== 'panic') {
      this.panic(ctx, e);
      return;
    }

    const nt = this.nextThink.get(e.id) ?? 0;
    if (time < nt && e.path.length === 0 && e.goal === null) {
      // idle between thoughts: slight wander handled at decision time
      return;
    }
    this.nextThink.set(e.id, time + 0.8 + ctx.rng.next() * 0.6);

    // Need-driven overrides (priority order).
    if (e.needs.hunger > 66) return this.goActivity(ctx, e, 'eat', 'CANTEEN');
    if (e.needs.fatigue > 72) return this.goActivity(ctx, e, 'sleep', 'CELL_BLOCK');
    if (e.needs.hygiene > 82) return this.goActivity(ctx, e, 'shower', 'INFIRMARY');
    if (e.needs.stress > 84) return this.goActivity(ctx, e, 'yard' as any, 'YARD');

    // Scheduled activity.
    const act = e.action as ScheduleActivity;
    const map: Record<string, { state: AnimState; type: string }> = {
      breakfast: { state: 'eat', type: 'CANTEEN' },
      lunch: { state: 'eat', type: 'CANTEEN' },
      dinner: { state: 'eat', type: 'CANTEEN' },
      work: { state: 'work', type: 'WORKSHOP' },
      workshop: { state: 'work', type: 'WORKSHOP' },
      yard: { state: 'walk', type: 'YARD' },
      shower: { state: 'shower', type: 'INFIRMARY' },
      medical: { state: 'idle', type: 'INFIRMARY' },
      visit: { state: 'talk', type: 'VISITING' },
      cell: { state: 'idle', type: 'CELL_BLOCK' },
      wake: { state: 'idle', type: 'CELL_BLOCK' },
      free: { state: 'walk', type: 'YARD' },
      patrol: { state: 'walk', type: 'YARD' },
      rest: { state: 'idle', type: 'SECURITY' },
    };
    const m = map[act] ?? { state: 'idle' as AnimState, type: 'CELL_BLOCK' };

    if (m.state === 'walk') {
      // wander inside the target building area
      const b = world.findNearestBuilding(e.x, e.y, ACTIVITY_BUILDING[m.type] ?? [m.type]);
      if (b) {
        if (this.inside(e, b)) {
          // already there → pick a random interior point to stroll
          this.wanderIn(ctx, e, b);
        } else {
          this.ensurePath(ctx, e, world.buildingCenter(b).x, world.buildingCenter(b).y, b.id);
        }
      } else this.wander(ctx, e);
    } else if (m.state === 'idle') {
      const b = world.findNearestBuilding(e.x, e.y, ACTIVITY_BUILDING[m.type] ?? [m.type]);
      if (b && !this.inside(e, b)) this.ensurePath(ctx, e, world.buildingCenter(b).x, world.buildingCenter(b).y, b.id);
      else e.state = 'idle';
    } else {
      this.goActivity(ctx, e, m.state, m.type);
    }

    // occasional fight with a rival/enemy
    this.maybeFight(ctx, e);
  }

  private goActivity(ctx: SimContext, e: Entity, state: AnimState, type: string) {
    const types = ACTIVITY_BUILDING[state] ?? [type];
    const b = ctx.world.findNearestBuilding(e.x, e.y, types);
    if (!b) {
      this.wander(ctx, e);
      return;
    }
    if (this.inside(e, b)) {
      this.startPerform(ctx, e, state, b);
    } else {
      this.ensurePath(ctx, e, ctx.world.buildingCenter(b).x, ctx.world.buildingCenter(b).y, b.id);
      e.state = 'walk';
    }
  }

  private startPerform(ctx: SimContext, e: Entity, state: AnimState, b: BuildingLike) {
    e.state = state;
    e.stateUntil = ctx.time + (DURATION[state] ?? 14);
    e.path = [];
    e.goal = null;
    e.goalBuildingId = b.id;
    if (state === 'eat') this.say(e, ctx, 'Miam…', 'talk');
    if (state === 'shower') this.say(e, ctx, 'Enfin une douche…', 'thought');
  }

  private perform(e: Entity, dt: number, ctx: SimContext) {
    const n = e.needs;
    switch (e.state) {
      case 'eat':
        n.hunger = clamp(n.hunger - 26 * dt, 0, 100);
        n.loneliness = clamp(n.loneliness - 4 * dt, 0, 100);
        break;
      case 'sleep':
        n.fatigue = clamp(n.fatigue - 22 * dt, 0, 100);
        if (n.fatigue < 28) this.release(e);
        break;
      case 'shower':
        n.hygiene = clamp(n.hygiene - 42 * dt, 0, 100);
        break;
      case 'work':
        n.stress = clamp(n.stress - 6 * dt, 0, 100);
        n.loneliness = clamp(n.loneliness - 5 * dt, 0, 100);
        n.respect = clamp(n.respect + 1 * dt, 0, 100);
        break;
      case 'fight':
        // damage both fighters
        if (e.target && e.target.state === 'fight') {
          e.target.health = clamp(e.target.health - 4 * dt, 0, 100);
          e.health = clamp(e.health - 3 * dt, 0, 100);
          e.target.needs.stress = clamp(e.target.needs.stress + 6 * dt, 0, 100);
          e.needs.stress = clamp(e.needs.stress + 4 * dt, 0, 100);
        }
        break;
    }
    if (ctx.rng.chance(0.4 * dt) && e.bubble == null) {
      // keep silent during perform mostly
    }
  }

  private release(e: Entity) {
    e.state = 'idle';
    e.path = [];
    e.goal = null;
    e.goalBuildingId = null;
    e.target = null;
    e.stateUntil = 0;
  }

  private panic(ctx: SimContext, e: Entity) {
    e.state = 'panic';
    e.stateUntil = ctx.time + 3;
    const b = ctx.world.findNearestBuilding(e.x, e.y, ['YARD', 'SECURITY']);
    if (b) this.ensurePath(ctx, e, ctx.world.buildingCenter(b).x, ctx.world.buildingCenter(b).y, b.id);
    else this.wander(ctx, e);
    if (ctx.rng.chance(0.5)) this.say(e, ctx, 'Quoi ?!', 'angry');
  }

  // ---------------- guards ----------------
  private guard(ctx: SimContext, e: Entity) {
    const { world, time } = ctx;
    if (PERFORM.includes(e.state) && time < e.stateUntil) return;
    if (PERFORM.includes(e.state) && time >= e.stateUntil) this.release(e);

    // intervene in nearby fights / arrests
    const fights = world.nearby(e.x, e.y, 140).filter((o) => o.state === 'fight' || o.state === 'panic');
    if (fights.length) {
      const t = fights[0];
      this.ensurePath(ctx, e, t.x, t.y, null);
      e.state = 'run';
      if (dist(e.x, e.y, t.x, t.y) < 26) {
        // break it up
        if (t.state === 'fight' && t.target) {
          t.state = 'arrested';
          t.stateUntil = time + 8;
          t.target.state = 'arrested';
          t.target.stateUntil = time + 8;
          ctx.bus.emit('arrested', { inmate: t, by: e });
          ctx.bus.emit('log', { level: 'warn', text: `${e.name} a maté ${t.name}.`, icon: 'police' });
          ctx.audio.play('alarm');
        } else if (t.state === 'panic') {
          t.state = 'idle';
          t.needs.stress = clamp(t.needs.stress - 20, 0, 100);
        }
      }
      return;
    }

    // routine patrol
    const nt = this.nextThink.get(e.id) ?? 0;
    if (time < nt && e.path.length === 0) return;
    this.nextThink.set(e.id, time + 2 + ctx.rng.next());

    if (e.action === 'rest') {
      const b = world.findNearestBuilding(e.x, e.y, ['SECURITY']);
      if (b && !this.inside(e, b)) this.ensurePath(ctx, e, world.buildingCenter(b).x, world.buildingCenter(b).y, b.id);
      else e.state = 'idle';
      return;
    }
    // patrol to a random operational room
    const rooms = world.buildings.filter((b) => b.category === 'room' && b.state === 'OPERATIONAL');
    if (rooms.length) {
      const b = ctx.rng.pick(rooms);
      this.ensurePath(ctx, e, world.buildingCenter(b).x, world.buildingCenter(b).y, b.id);
      e.state = 'walk';
    }
  }

  // ---------------- helpers ----------------
  private ensurePath(ctx: SimContext, e: Entity, tx: number, ty: number, buildingId: number | null) {
    const needRecalc =
      e.recalcAt > 0 ||
      e.goal === null ||
      dist(e.goal.x, e.goal.y, tx, ty) > 6 ||
      e.goalBuildingId !== buildingId ||
      e.path.length === 0;
    if (!needRecalc) return;
    e.recalcAt = 0;
    const path = ctx.astar.find(e.x, e.y, tx, ty);
    if (path && path.length > 0) {
      // drop the first waypoint if we're basically on it
      e.path = path;
      e.pathIndex = 0;
      e.goal = { x: tx, y: ty };
      e.goalBuildingId = buildingId;
      if (e.state !== 'run' && e.state !== 'panic') e.state = 'walk';
    } else {
      e.path = [];
      e.goal = null;
      e.recalcAt = ctx.time + 2; // retry later
    }
  }

  private inside(e: Entity, b: BuildingLike): boolean {
    return e.x >= b.x && e.x <= b.x + b.w && e.y >= b.y && e.y <= b.y + b.h;
  }

  private wander(ctx: SimContext, e: Entity) {
    const g = ctx.grid;
    for (let i = 0; i < 8; i++) {
      const x = ctx.rng.range(40, g.worldW - 40);
      const y = ctx.rng.range(40, g.worldH - 40);
      if (g.isWalkable(g.toTileX(x), g.toTileY(y))) {
        this.ensurePath(ctx, e, x, y, null);
        e.state = 'walk';
        return;
      }
    }
  }

  private wanderIn(ctx: SimContext, e: Entity, b: BuildingLike) {
    const x = ctx.rng.range(b.x + 8, b.x + b.w - 8);
    const y = ctx.rng.range(b.y + 8, b.y + b.h - 8);
    if (ctx.grid.isWalkable(ctx.grid.toTileX(x), ctx.grid.toTileY(y))) {
      this.ensurePath(ctx, e, x, y, null);
    }
  }

  private maybeFight(ctx: SimContext, e: Entity) {
    if (e.fightCooldown > ctx.time) return;
    const aggressive = e.traits.aggressiveness > 60 && e.traits.discipline < 55;
    if (!aggressive) return;
    if (!ctx.rng.chance(0.06 * ctx.dt)) return;
    const rivals = ctx.world
      .nearby(e.x, e.y, 60)
      .filter((o) => o.kind === 'inmate' && o.id !== e.id && o.state !== 'fight' && o.state !== 'arrested');
    if (!rivals.length) return;
    // prefer enemies / low friends
    let target: Entity | undefined;
    for (const r of rivals) {
      const rel = e.relations.get(r.id);
      if (rel && rel.type === 'enemy') {
        target = r;
        break;
      }
    }
    target = target ?? ctx.rng.pick(rivals);
    if (!target) return;

    e.state = 'fight';
    e.target = target;
    e.stateUntil = ctx.time + 4 + ctx.rng.next() * 3;
    target.state = 'fight';
    target.target = e;
    target.stateUntil = e.stateUntil;
    target.fightCooldown = ctx.time + 20;
    e.fightCooldown = ctx.time + 20;

    // relationship worsens
    this.setRelation(e, target, 'enemy', -20);
    this.setRelation(target, e, 'enemy', -20);

    ctx.bus.emit('fight', { a: e, b: target, x: (e.x + target.x) / 2, y: (e.y + target.y) / 2 });
    ctx.bus.emit('log', { level: 'warn', text: `Bagarre : ${e.name} vs ${target.name}`, icon: 'fight' });
    ctx.bus.emit('alarm', { x: e.x, y: e.y, reason: 'fight' });
    ctx.audio.play('fight');
    this.say(target, ctx, 'Hé !', 'angry');
  }

  private setRelation(a: Entity, b: Entity, type: 'friend' | 'enemy' | 'neutral' | 'rival', delta: number) {
    const rel = a.relations.get(b.id) ?? { targetId: b.id, type: 'neutral', strength: 0, trust: 50 };
    rel.strength = clamp(rel.strength + delta, -100, 100);
    rel.type = type;
    a.relations.set(b.id, rel);
  }

  private say(e: Entity, ctx: SimContext, text: string, kind: any) {
    e.bubble = { kind, text, until: ctx.time + 3 };
  }
}

// silence unused import in some builds
void INTERACTIONS;
