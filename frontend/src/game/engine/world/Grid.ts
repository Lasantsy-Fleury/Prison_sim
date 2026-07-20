// Tile grid derived from the prison layout. Rooms are walled boxes with a single
// door gap so agents must path through doors (never teleport through walls).
// Also exposes dynamic obstacle overlays so agents recompute when the world changes.

import type { BuildingLike } from './types';
import { clamp } from '../core/MathUtils';

export const TILE = 20; // logical world units per tile

export interface DoorTile {
  bx: number;
  by: number;
  tx: number;
  ty: number;
  cx: number; // world center
  cy: number;
}

export class Grid {
  readonly W: number;
  readonly H: number;
  readonly tile = TILE;
  /** 1 = walkable, 0 = wall. */
  walkable: Uint8Array;
  /** Temporary dynamic blocks (fights, fires). */
  private dynamic: Uint8Array;
  doors: DoorTile[] = [];
  private doorByBuilding = new Map<number, DoorTile>();

  constructor(public worldW: number, public worldH: number) {
    this.W = Math.ceil(worldW / TILE);
    this.H = Math.ceil(worldH / TILE);
    this.walkable = new Uint8Array(this.W * this.H).fill(1);
    this.dynamic = new Uint8Array(this.W * this.H);
    this.buildPerimeter();
  }

  idx(tx: number, ty: number): number {
    return ty * this.W + tx;
  }

  inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < this.W && ty < this.H;
  }

  private set(tx: number, ty: number, v: number) {
    if (this.inBounds(tx, ty)) this.walkable[this.idx(tx, ty)] = v;
  }

  isWalkable(tx: number, ty: number): boolean {
    if (!this.inBounds(tx, ty)) return false;
    const i = this.idx(tx, ty);
    return this.walkable[i] === 1 && this.dynamic[i] === 0;
  }

  /** World coordinate → tile. */
  toTileX(wx: number): number {
    return clamp(Math.floor(wx / TILE), 0, this.W - 1);
  }
  toTileY(wy: number): number {
    return clamp(Math.floor(wy / TILE), 0, this.H - 1);
  }
  /** Tile center → world. */
  centerX(tx: number): number {
    return tx * TILE + TILE / 2;
  }
  centerY(ty: number): number {
    return ty * TILE + TILE / 2;
  }

  private buildPerimeter() {
    // Outer fence wall with two gate gaps (entrances).
    for (let tx = 0; tx < this.W; tx++) {
      this.set(tx, 0, 0);
      this.set(tx, this.H - 1, 0);
    }
    for (let ty = 0; ty < this.H; ty++) {
      this.set(0, ty, 0);
      this.set(this.W - 1, ty, 0);
    }
    // Gates
    const gateXs = [Math.floor(this.W * 0.5), Math.floor(this.W * 0.18)];
    for (const gx of gateXs) {
      this.set(gx, 0, 1);
      this.set(gx, this.H - 1, 1);
      this.set(0, Math.floor(this.H * 0.5), 1);
    }
  }

  /** Rebuild walls/doors from the current building list. */
  rebuild(buildings: BuildingLike[]) {
    this.walkable.fill(1);
    this.doors = [];
    this.doorByBuilding.clear();
    this.buildPerimeter();

    for (const b of buildings) {
      if (b.category !== 'room') {
        // Installations: fences add walls, others are passable decorations.
        if (b.type === 'FENCE' || b.type === 'BARBED_WIRE') {
          this.carveRect(b, 0);
        }
        continue;
      }
      if (b.state === 'UNDER_CONSTRUCTION') continue;
      const tx0 = this.toTileX(b.x);
      const ty0 = this.toTileY(b.y);
      const tx1 = this.toTileX(b.x + b.w - 1);
      const ty1 = this.toTileY(b.y + b.h - 1);
      // Carve interior as walkable.
      for (let ty = ty0; ty <= ty1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) this.set(tx, ty, 1);
      // Wall ring.
      for (let tx = tx0; tx <= tx1; tx++) {
        this.set(tx, ty0, 0);
        this.set(tx, ty1, 0);
      }
      for (let ty = ty0; ty <= ty1; ty++) {
        this.set(tx0, ty, 0);
        this.set(tx1, ty, 0);
      }
      // Door gap on bottom-center.
      const dx = Math.round((tx0 + tx1) / 2);
      this.set(dx, ty1, 1);
      const door: DoorTile = {
        bx: b.id,
        by: b.y + b.h,
        tx: dx,
        ty: ty1,
        cx: this.centerX(dx),
        cy: this.centerY(ty1),
      };
      this.doors.push(door);
      this.doorByBuilding.set(b.id, door);
    }
  }

  private carveRect(b: BuildingLike, v: number) {
    const tx0 = this.toTileX(b.x);
    const ty0 = this.toTileY(b.y);
    const tx1 = this.toTileX(b.x + b.w - 1);
    const ty1 = this.toTileY(b.y + b.h - 1);
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) this.set(tx, ty, v);
  }

  doorForBuilding(id: number): DoorTile | undefined {
    return this.doorByBuilding.get(id);
  }

  /** Find nearest walkable tile to a world point (spiral search). */
  nearestWalkable(wx: number, wy: number, maxRadius = 12): WorldPointOut {
    const sx = this.toTileX(wx);
    const sy = this.toTileY(wy);
    if (this.isWalkable(sx, sy)) return { x: this.centerX(sx), y: this.centerY(sy) };
    for (let r = 1; r <= maxRadius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = sx + dx;
          const ty = sy + dy;
          if (this.isWalkable(tx, ty)) return { x: this.centerX(tx), y: this.centerY(ty) };
        }
      }
    }
    return { x: this.centerX(sx), y: this.centerY(sy) };
  }

  setDynamic(tx: number, ty: number, blocked: boolean) {
    if (this.inBounds(tx, ty)) this.dynamic[this.idx(tx, ty)] = blocked ? 1 : 0;
  }

  clearDynamic() {
    this.dynamic.fill(0);
  }
}

export interface WorldPointOut {
  x: number;
  y: number;
}
