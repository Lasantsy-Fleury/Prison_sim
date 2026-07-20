// Path following + light collision/separation. Agents walk (never teleport),
// recompute their route when blocked, and push apart so crowds don't overlap.

import type { SimContext } from '../core/SimContext';
import type { Entity } from '../world/types';
import { dist } from '../core/MathUtils';

export class MovementSystem {
  private stuckTimers = new Map<number, number>();

  update(ctx: SimContext) {
    const { world, dt } = ctx;
    for (const e of world.entities.values()) {
      // Locked states don't move on their own.
      const locked = e.state === 'fight' || e.state === 'injured' || e.state === 'arrested' || e.state === 'sleep' || e.state === 'eat' || e.state === 'escort';
      if (locked) {
        e.vx = 0;
        e.vy = 0;
        continue;
      }

      if (e.path.length > 0 && e.pathIndex < e.path.length) {
        const wp = e.path[e.pathIndex];
        const dx = wp.x - e.x;
        const dy = wp.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 2) {
          e.pathIndex++;
        } else {
          const sp = e.speed * (e.state === 'run' || e.state === 'panic' ? 1.7 : 1);
          const step = Math.min(sp * dt, d);
          const nx = e.x + (dx / d) * step;
          const ny = e.y + (dy / d) * step;
          const tx = ctx.grid.toTileX(nx);
          const ty = ctx.grid.toTileY(ny);
          if (ctx.grid.isWalkable(tx, ty)) {
            e.x = nx;
            e.y = ny;
            e.vx = (dx / d) * sp;
            e.vy = (dy / d) * sp;
            this.stuckTimers.set(e.id, 0);
          } else {
            // blocked by wall → request recompute soon
            this.stuckTimers.set(e.id, (this.stuckTimers.get(e.id) ?? 0) + dt);
            e.vx = 0;
            e.vy = 0;
          }
        }
      } else {
        e.path = [];
        e.vx = 0;
        e.vy = 0;
      }

      // recompute if stuck
      const stuck = this.stuckTimers.get(e.id) ?? 0;
      if (stuck > 0.6 && e.goal) {
        this.stuckTimers.set(e.id, 0);
        e.recalcAt = ctx.time; // signal AI to recompute
      }
    }

    this.separate(world, dt);
  }

  /** Soft separation so agents don't stack on the same tile. */
  private separate(world: { entities: Map<number, Entity>; spatial: any; nearby: (x: number, y: number, r: number, k?: Entity['kind']) => Entity[] }, dt: number) {
    void dt;
    for (const e of world.entities.values()) {
      if (e.state === 'fight' || e.state === 'arrested') continue;
      const near = world.nearby(e.x, e.y, 13, e.kind);
      let px = 0;
      let py = 0;
      let n = 0;
      for (const o of near) {
        if (o.id === e.id) continue;
        const dx = e.x - o.x;
        const dy = e.y - o.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < 13) {
          const push = (13 - d) / 13;
          px += (dx / d) * push;
          py += (dy / d) * push;
          n++;
        }
      }
      if (n > 0) {
        e.x += px * 0.6;
        e.y += py * 0.6;
      }
    }
  }
}
