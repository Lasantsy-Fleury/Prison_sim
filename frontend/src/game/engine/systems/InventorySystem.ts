// Inventory effects: contraband shapes events. Guards occasionally search and
// confiscate; contraband raises the odds of trouble (spec §10).

import type { SimContext } from '../core/SimContext';
import type { Entity } from '../world/types';

export class InventorySystem {
  private searchTimer = 0;

  update(ctx: SimContext) {
    const { world, dt, time, rng } = ctx;
    this.searchTimer -= dt;
    if (this.searchTimer > 0) return;
    this.searchTimer = 8 + rng.next() * 8;

    const guards = world.list('guard');
    if (!guards.length) return;

    for (const g of guards) {
      const suspects = world.nearby(g.x, g.y, 36, 'inmate');
      for (const s of suspects) {
        const contraband = s.inventory.items.find((i) => i.contraband && i.qty > 0);
        if (!contraband) continue;
        // chance to spot & confiscate scales with guard skill and inmate notoriety
        const p = 0.15 + (g.traits?.intelligence ?? 50) / 400;
        if (!rng.chance(p)) continue;
        s.inventory.items = s.inventory.items.filter((i) => i !== contraband);
        s.inventory.money = Math.max(0, s.inventory.money - 2);
        s.needs.respect = Math.max(0, s.needs.respect - 8);
        s.reputation = Math.max(-100, s.reputation - 5);
        g.bubble = { kind: 'threat', text: 'Contrebande saisie.', until: time + 3 };
        ctx.bus.emit('log', { level: 'info', text: `${g.name} a confisqué ${contraband.label} à ${s.name}`, icon: 'search' });
        ctx.audio.play('door');
      }
    }
  }
}
