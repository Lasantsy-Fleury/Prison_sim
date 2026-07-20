// Seeded pseudo-random generator (mulberry32) so worlds are reproducible from a seed.

export class Rng {
  private state: number;

  constructor(seed = 0x12345678) {
    this.state = seed >>> 0;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Weighted pick. `weights` parallel to `items`. */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    let total = 0;
    for (const w of weights) total += w;
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Gaussian-ish around `mean` with `spread`, clamped to [min,max]. */
  gaussian(mean: number, spread: number, min = -Infinity, max = Infinity): number {
    const g = (this.next() + this.next() + this.next()) / 3; // ~triangle
    return Math.max(min, Math.min(max, mean + (g - 0.5) * 2 * spread));
  }

  reseed(seed: number) {
    this.state = seed >>> 0;
  }
}
