// Smooth camera with pan, zoom-at-cursor and follow. World→screen transforms are
// computed here so the renderer stays unaware of viewport math.

import type { Entity } from '../world/types';
import { clamp, lerp } from '../core/MathUtils';

export class Camera {
  x: number; // world point shown at viewport center
  y: number;
  zoom = 1;
  private desiredX: number;
  private desiredY: number;
  private desiredZoom = 1;
  follow: Entity | null = null;
  vw = 800;
  vh = 600;
  minZoom = 0.35;
  maxZoom = 3;
  worldW = 1000;
  worldH = 640;

  constructor(x: number, y: number) {
    this.x = this.desiredX = x;
    this.y = this.desiredY = y;
  }

  setViewport(w: number, h: number) {
    this.vw = w;
    this.vh = h;
  }

  setWorld(w: number, h: number) {
    this.worldW = w;
    this.worldH = h;
  }

  clampDesired() {
    const halfW = this.vw / 2 / this.desiredZoom;
    const halfH = this.vh / 2 / this.desiredZoom;
    if (this.worldW > halfW * 2) this.desiredX = clamp(this.desiredX, halfW, this.worldW - halfW);
    else this.desiredX = this.worldW / 2;
    if (this.worldH > halfH * 2) this.desiredY = clamp(this.desiredY, halfH, this.worldH - halfH);
    else this.desiredY = this.worldH / 2;
  }

  centerOn(wx: number, wy: number) {
    this.desiredX = wx;
    this.desiredY = wy;
    this.clampDesired();
  }

  setZoom(z: number, sx?: number, sy?: number) {
    const nz = clamp(z, this.minZoom, this.maxZoom);
    if (sx != null && sy != null) {
      const before = this.screenToWorld(sx, sy);
      this.desiredZoom = nz;
      this.clampDesired();
      // after zoom, keep cursor world point under cursor
      const after = this.screenToWorld(sx, sy);
      this.desiredX += before.x - after.x;
      this.desiredY += before.y - after.y;
      this.clampDesired();
    } else {
      this.desiredZoom = nz;
      this.clampDesired();
    }
  }

  zoomBy(factor: number, sx: number, sy: number) {
    this.setZoom(this.desiredZoom * factor, sx, sy);
  }

  panByScreen(dx: number, dy: number) {
    this.follow = null;
    this.desiredX -= dx / this.desiredZoom;
    this.desiredY -= dy / this.desiredZoom;
    this.clampDesired();
  }

  followEntity(e: Entity | null) {
    this.follow = e;
  }

  update(dt: number) {
    if (this.follow) {
      this.desiredX = this.follow.x;
      this.desiredY = this.follow.y;
      this.clampDesired();
    }
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent smoothing
    this.x = lerp(this.x, this.desiredX, k);
    this.y = lerp(this.y, this.desiredY, k);
    this.zoom = lerp(this.zoom, this.desiredZoom, k);
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx - this.x) * this.zoom + this.vw / 2,
      y: (wy - this.y) * this.zoom + this.vh / 2,
    };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.vw / 2) / this.zoom + this.x,
      y: (sy - this.vh / 2) / this.zoom + this.y,
    };
  }
}
