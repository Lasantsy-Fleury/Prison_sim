// Social simulation: relationships drift from daily contact, gangs form and war,
// and reputation/influence/popularity evolve (spec §8).

import type { SimContext } from '../core/SimContext';
import type { Entity } from '../world/types';
import { GANG_NAMES } from '../data/presets';
import { clamp } from '../core/MathUtils';

export class SocialSystem {
  private gangTimer = 0;
  private warTimer = 0;

  update(ctx: SimContext) {
    const { world, dt, time, rng } = ctx;
    const inmates = world.list('inmate');

    // Relationship drift from proximity.
    for (let i = 0; i < inmates.length; i++) {
      const a = inmates[i];
      const near = world.nearby(a.x, a.y, 40, 'inmate');
      for (const b of near) {
        if (b.id <= a.id) continue; // each pair once
        const relA = a.relations.get(b.id);
        const sim = a.psychology.orientation === b.psychology.orientation ? 1 : -0.5;
        const sameGang = a.gang && a.gang === b.gang;
        const delta = (sameGang ? 2 : 0.4) + (rng.chance(0.1) ? sim * 0.5 : 0) - (rng.chance(0.05) ? 1 : 0);
        void relA;
        if (relA) relA.strength = clamp(relA.strength + delta * dt, -100, 100);
        else a.relations.set(b.id, { targetId: b.id, type: 'neutral', strength: delta, trust: 50 });
        const relB2 = b.relations.get(a.id) ?? { targetId: a.id, type: 'neutral', strength: 0, trust: 50 };
        relB2.strength = clamp(relB2.strength + delta * dt, -100, 100);
        b.relations.set(a.id, relB2);
        this.retype(a, b.id);
        this.retype(b, a.id);
      }
    }

    // Reputation / influence / popularity drift.
    for (const e of inmates) {
      let friends = 0;
      let enemies = 0;
      for (const rel of e.relations.values()) {
        if (rel.strength > 25) friends++;
        else if (rel.strength < -25) enemies++;
      }
      e.popularity = clamp(e.popularity + (friends - enemies * 0.5) * 0.5 * dt, 0, 100);
      e.influence = clamp(e.influence + (e.popularity - 40) * 0.02 * dt, 0, 100);
      e.reputation = clamp(e.reputation + (e.popularity - 50) * 0.05 * dt, -100, 100);
    }

    // Gang formation.
    this.gangTimer -= dt;
    if (this.gangTimer <= 0) {
      this.gangTimer = 30 + rng.next() * 30;
      this.tryFormGang(ctx);
    }

    // Gang wars.
    this.warTimer -= dt;
    if (this.warTimer <= 0 && world.gangs.size >= 2) {
      this.warTimer = 45 + rng.next() * 30;
      this.tryGangWar(ctx);
    }
  }

  private retype(e: Entity, id: number) {
    const rel = e.relations.get(id);
    if (!rel) return;
    if (rel.strength > 30) rel.type = 'friend';
    else if (rel.strength < -30) rel.type = 'enemy';
    else rel.type = 'neutral';
  }

  private tryFormGang(ctx: SimContext) {
    const { world, rng } = ctx;
    if (world.gangs.size >= GANG_NAMES.length) return;
    const candidates = world
      .list('inmate')
      .filter((e) => !e.gang && e.influence > 35 && e.traits.aggressiveness > 45);
    if (candidates.length < 3) return;
    const name = GANG_NAMES.find((n) => !world.gangs.has(n));
    if (!name) return;
    const boss = candidates.sort((a, b) => b.influence - a.influence)[0];
    const members = [boss];
    for (const c of candidates) {
      if (c.id === boss.id) continue;
      if (rng.chance(0.4)) members.push(c);
      if (members.length >= 4 + rng.int(0, 3)) break;
    }
    for (const m of members) {
      m.gang = name;
      world.addToGang(name, m.id);
    }
    ctx.bus.emit('gang:formed', { name, members: members.map((m) => m.id) });
    ctx.bus.emit('log', { level: 'warn', text: `Nouveau gang : ${name}`, icon: 'gang' });
    ctx.audio.play('radio');
  }

  private tryGangWar(ctx: SimContext) {
    const { world, rng } = ctx;
    const gangs = Array.from(world.gangs.keys());
    const a = rng.pick(gangs);
    let b = rng.pick(gangs);
    if (a === b) return;
    ctx.bus.emit('gang:war', { a, b });
    ctx.bus.emit('log', { level: 'critical', text: `Guerre de territoire : ${a} vs ${b}`, icon: 'war' });
    ctx.bus.emit('alarm', { x: rng.range(100, 900), y: rng.range(100, 500), reason: 'gang' });
    ctx.audio.play('alarm');
  }
}
