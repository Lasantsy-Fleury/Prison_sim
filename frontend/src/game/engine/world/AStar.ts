// A* pathfinding over the tile Grid. 8-directional with corner-cut prevention.
// Returns a list of world-space waypoints (tile centers) from start to goal.

import type { Grid } from './Grid';
import type { WorldPoint } from './types';

interface Node {
  tx: number;
  ty: number;
  g: number;
  f: number;
  parent: Node | null;
}

// Binary min-heap keyed on `f`.
class MinHeap {
  private a: Node[] = [];
  get size() {
    return this.a.length;
  }
  push(n: Node) {
    const a = this.a;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): Node | undefined {
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      const n = a.length;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let s = i;
        if (l < n && a[l].f < a[s].f) s = l;
        if (r < n && a[r].f < a[s].f) s = r;
        if (s === i) break;
        [a[s], a[i]] = [a[i], a[s]];
        i = s;
      }
    }
    return top;
  }
}

const DIRS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, 1.41421356],
  [1, -1, 1.41421356],
  [-1, 1, 1.41421356],
  [-1, -1, 1.41421356],
];

function octile(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return dx > dy ? dx + (1.41421356 - 1) * dy : dy + (1.41421356 - 1) * dx;
}

export class AStar {
  constructor(private grid: Grid) {}

  /**
   * Find a path between two world points. Returns [] if already at goal,
   * null if unreachable.
   */
  find(sx: number, sy: number, gx: number, gy: number): WorldPoint[] | null {
    const g = this.grid;
    const stx = g.toTileX(sx);
    const sty = g.toTileY(sy);
    let gtx = g.toTileX(gx);
    let gty = g.toTileY(gy);

    if (!g.isWalkable(gtx, gty)) {
      const n = g.nearestWalkable(gx, gy);
      gtx = g.toTileX(n.x);
      gty = g.toTileY(n.y);
    }
    if (!g.isWalkable(stx, sty)) {
      const n = g.nearestWalkable(sx, sy);
      // start will be snapped by caller; use as is
      void n;
    }
    if (stx === gtx && sty === gty) return [];

    const open = new MinHeap();
    const came = new Map<number, Node>();
    const gScore = new Map<number, number>();
    const closed = new Set<number>();

    const startKey = sty * g.W + stx;
    const start: Node = { tx: stx, ty: sty, g: 0, f: octile(stx, sty, gtx, gty), parent: null };
    gScore.set(startKey, 0);
    came.set(startKey, start);
    open.push(start);

    let iterations = 0;
    const maxIter = g.W * g.H * 2;

    while (open.size > 0 && iterations++ < maxIter) {
      const cur = open.pop()!;
      const curKey = cur.ty * g.W + cur.tx;
      if (closed.has(curKey)) continue;
      closed.add(curKey);

      if (cur.tx === gtx && cur.ty === gty) {
        return this.reconstruct(came, cur);
      }

      for (const [dx, dy, cost] of DIRS) {
        const nx = cur.tx + dx;
        const ny = cur.ty + dy;
        if (!g.isWalkable(nx, ny)) continue;
        // Prevent cutting across wall corners on diagonals.
        if (dx !== 0 && dy !== 0) {
          if (!g.isWalkable(cur.tx + dx, cur.ty) || !g.isWalkable(cur.tx, cur.ty + dy)) continue;
        }
        const nKey = ny * g.W + nx;
        if (closed.has(nKey)) continue;
        const tentative = cur.g + cost;
        const prev = gScore.get(nKey);
        if (prev === undefined || tentative < prev) {
          gScore.set(nKey, tentative);
          const node: Node = {
            tx: nx,
            ty: ny,
            g: tentative,
            f: tentative + octile(nx, ny, gtx, gty),
            parent: cur,
          };
          came.set(nKey, node);
          open.push(node);
        }
      }
    }
    return null;
  }

  private reconstruct(came: Map<number, Node>, end: Node): WorldPoint[] {
    const path: WorldPoint[] = [];
    let n: Node | null = end;
    while (n && n.parent) {
      path.push({ x: this.grid.centerX(n.tx), y: this.grid.centerY(n.ty) });
      n = n.parent;
    }
    path.reverse();
    return path;
  }
}
