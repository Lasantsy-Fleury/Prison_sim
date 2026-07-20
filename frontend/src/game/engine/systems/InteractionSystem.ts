// Proximity interactions. When two idle inmates meet they may talk, threaten,
// trade, help, etc., showing a speech bubble above their heads (spec §9).

import type { SimContext } from '../core/SimContext';
import type { Entity } from '../world/types';
import { INTERACTIONS } from '../data/presets';
import { clamp } from '../core/MathUtils';

export class InteractionSystem {
  private cooldown = new Map<number, number>();

  update(ctx: SimContext) {
    const { world, time, dt, rng } = ctx;
    const inmates = world.list('inmate');
    for (const e of inmates) {
      const cd = this.cooldown.get(e.id) ?? 0;
      if (time < cd) continue;
      if (e.state === 'fight' || e.state === 'arrested' || e.state === 'sleep' || e.state === 'eat') continue;
      if (e.bubble && e.bubble.until > time) continue;
      if (!rng.chance(0.5 * dt)) continue;

      const others = world.nearby(e.x, e.y, 20, 'inmate').filter((o) => o.id !== e.id && o.state !== 'fight');
      if (!others.length) continue;
      const other = others[0];

      const choice = rng.weighted(
        INTERACTIONS,
        INTERACTIONS.map((i) => i.weight),
      );
      e.bubble = { kind: choice.bubbleKind, text: choice.bubble, until: time + 2.6 };
      other.bubble = { kind: 'talk', text: rng.chance(0.5) ? 'Ouais…' : 'Haha', until: time + 2.6 };
      e.state = 'talk';
      e.stateUntil = time + 1.2;
      this.cooldown.set(e.id, time + 6 + rng.next() * 6);
      this.cooldown.set(other.id, time + 6 + rng.next() * 6);

      const rel = e.relations.get(other.id) ?? { targetId: other.id, type: 'neutral' as const, strength: 0, trust: 50 };
      if (choice.kind === 'talk' || choice.kind === 'joke' || choice.kind === 'share' || choice.kind === 'help') {
        rel.strength = clamp(rel.strength + 3, -100, 100);
        other.popularity = clamp(other.popularity + 0.5, 0, 100);
      } else if (choice.kind === 'threat' || choice.kind === 'insult') {
        rel.strength = clamp(rel.strength - 5, -100, 100);
        if (rel.strength < -30) rel.type = 'enemy';
      } else if (choice.kind === 'recruit' && e.gang) {
        other.gang = e.gang;
        world.addToGang(e.gang, other.id);
      } else if (choice.kind === 'trade') {
        // move a contraband item if available
        const item = e.inventory.items.find((it) => it.contraband && it.qty > 0);
        if (item && rng.chance(0.5)) {
          item.qty--;
          if (item.qty <= 0) e.inventory.items = e.inventory.items.filter((i) => i !== item);
          other.inventory.items.push({ ...item, qty: 1 });
          other.inventory.money += 5;
        }
      }
      e.relations.set(other.id, rel);

      ctx.bus.emit('interaction', { kind: choice.kind, a: e, b: other, x: e.x, y: e.y, text: choice.bubble });
      if (rng.chance(0.3)) ctx.audio.play('talk');
    }
  }
}
