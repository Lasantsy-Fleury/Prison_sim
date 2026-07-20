// Uniform spatial hash grid for O(1) neighbour queries. Used by the interaction,
// collision and social systems to avoid N^2 scans across hundreds of agents.

export interface SpatialItem {
  x: number;
  y: number;
  id: number;
}

export class SpatialHash {
  private cells = new Map<number, SpatialItem[]>();
  private readonly cellSize: number;

  constructor(cellSize = 64) {
    this.cellSize = cellSize;
  }

  private key(cx: number, cy: number): number {
    // Pack two signed 16-bit cell coords into one number key.
    return ((cx + 32768) << 16) | (cy + 32768);
  }

  clear() {
    this.cells.clear();
  }

  insert(item: SpatialItem) {
    const cx = Math.floor(item.x / this.cellSize);
    const cy = Math.floor(item.y / this.cellSize);
    const k = this.key(cx, cy);
    let bucket = this.cells.get(k);
    if (!bucket) {
      bucket = [];
      this.cells.set(k, bucket);
    }
    bucket.push(item);
  }

  rebuild(items: SpatialItem[]) {
    this.clear();
    for (const it of items) this.insert(it);
  }

  /** Visit every item within `radius` of (x,y). Callback returns void. */
  query(x: number, y: number, radius: number, cb: (item: SpatialItem) => void) {
    const r2 = radius * radius;
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const it of bucket) {
          const dx = it.x - x;
          const dy = it.y - y;
          if (dx * dx + dy * dy <= r2) cb(it);
        }
      }
    }
  }

  /** Returns ids of items near (x,y) within radius (allocates an array). */
  queryIds(x: number, y: number, radius: number): number[] {
    const out: number[] = [];
    this.query(x, y, radius, (it) => out.push(it.id));
    return out;
  }
}
