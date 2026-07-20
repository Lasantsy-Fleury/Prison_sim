// Advances animation phase per entity and resolves movement ↔ idle transitions.
// Busy states (fight, sleep, eat, injured, arrested) are locked by the AI system
// and never overridden here.

import type { World } from '../world/World';
import type { AnimState } from '../world/types';

const PHASE_RATE: Record<AnimState, number> = {
  idle: 1.2,
  walk: 6,
  run: 10,
  eat: 3,
  sleep: 0.6,
  fight: 8,
  talk: 2,
  work: 4,
  panic: 9,
  injured: 1,
  arrested: 1,
  shower: 3,
  escort: 5,
};

const BUSY: AnimState[] = ['fight', 'sleep', 'eat', 'injured', 'arrested', 'shower'];

export class AnimationManager {
  update(world: World, dt: number) {
    for (const e of world.entities.values()) {
      const moving = e.path.length > 0 && e.pathIndex < e.path.length;
      const speed2 = e.vx * e.vx + e.vy * e.vy;

      if (!BUSY.includes(e.state)) {
        if (moving || speed2 > 1) {
          if (e.state === 'idle' || e.state === 'talk') e.state = 'walk';
        } else if (e.state === 'walk' || e.state === 'run') {
          e.state = 'idle';
        }
      }

      if (e.vx > 0.6) e.facing = 1;
      else if (e.vx < -0.6) e.facing = -1;

      const rate = PHASE_RATE[e.state] ?? 2;
      e.animPhase += rate * dt;
      if (e.animPhase > 100000) e.animPhase -= 100000;
    }
  }
}
