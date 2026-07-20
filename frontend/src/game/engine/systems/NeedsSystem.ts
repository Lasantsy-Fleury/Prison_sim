// Needs evolve continuously and drive AI decisions. Also derives mood.

import type { SimContext } from '../core/SimContext';
import type { Entity } from '../world/types';
import { clamp } from '../core/MathUtils';

export class NeedsSystem {
  update(ctx: SimContext) {
    const { world, dt } = ctx;
    for (const e of world.entities.values()) {
      if (e.kind === 'guard') {
        this.guardNeeds(e, dt);
        continue;
      }
      const n = e.needs;
      const awake = e.state !== 'sleep';

      n.hunger = clamp(n.hunger + (awake ? 1.4 : 0.2) * dt, 0, 100);
      n.hygiene = clamp(n.hygiene + (awake ? 1.0 : 0.3) * dt, 0, 100);
      n.fatigue = clamp(n.fatigue + (awake ? 1.1 : -6) * dt, 0, 100);

      // stress drifts toward trait baseline, reduced when calm
      const stressBase = 30 + e.traits.aggressiveness * 0.2 - e.traits.discipline * 0.15;
      n.stress = clamp(n.stress + (stressBase - n.stress) * 0.05 * dt + (e.state === 'panic' ? 8 : 0) * dt, 0, 100);

      // health regen when rested & fed, decay when starving
      if (n.hunger > 90) n.health = clamp(n.health - 1.5 * dt, 0, 100);
      else if (n.health < 100 && n.fatigue < 80 && n.stress < 85)
        n.health = clamp(n.health + 1.2 * dt, 0, 100);

      // loneliness grows when alone, drops when socializing
      if (e.state === 'talk' || e.state === 'eat' || e.state === 'work') n.loneliness = clamp(n.loneliness - 3 * dt, 0, 100);
      else n.loneliness = clamp(n.loneliness + 1.2 * dt, 0, 100);

      n.security = clamp(n.security + (40 - n.security) * 0.02 * dt, 0, 100);
      n.freedom = clamp(n.freedom + (70 - n.freedom) * 0.01 * dt, 0, 100);
      n.confidence = clamp(n.confidence + (e.traits.aggressiveness - n.confidence) * 0.01 * dt, 0, 100);
      n.respect = clamp(n.respect + (e.reputation - n.respect) * 0.01 * dt, 0, 100);

      // mood
      const wellbeing =
        100 - n.hunger * 0.5 - n.fatigue * 0.4 - n.stress * 0.5 - n.hygiene * 0.3 +
        n.respect * 0.2 + e.traits.morale * 0.3;
      e.mood = clamp(Math.round(wellbeing), 0, 100);
    }
  }

  private guardNeeds(e: Entity, dt: number) {
    const n = e.needs;
    n.fatigue = clamp(n.fatigue + 0.6 * dt, 0, 100);
    n.hunger = clamp(n.hunger + 0.8 * dt, 0, 100);
    n.stress = clamp(n.stress + (25 - n.stress) * 0.05 * dt, 0, 100);
    n.health = clamp(n.health + 0.5 * dt, 0, 100);
    e.mood = clamp(Math.round(70 - n.fatigue * 0.3), 0, 100);
  }
}
