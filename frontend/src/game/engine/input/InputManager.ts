// Input manager: pan (drag), zoom-at-cursor (wheel), click-to-select, right-click
// radial menu, and keyboard shortcuts. Pure DOM wiring; forwards intents to the
// engine via callbacks so it stays decoupled from game logic.

import type { Camera } from '../camera/Camera';
import type { Entity } from '../world/types';

export interface InputHandlers {
  canvas: HTMLCanvasElement;
  camera: Camera;
  /** True while a build placement is active (suppresses pan/select). */
  isPlacing: () => boolean;
  /** Pick the topmost entity at screen coords (or null). */
  pick: (sx: number, sy: number) => Entity | null;
  onSelectEntity: (e: Entity | null) => void;
  onBackgroundClick: (worldX: number, worldY: number) => void;
  onRadial: (e: Entity, clientX: number, clientY: number) => void;
  onKey: (action: string) => void;
  onFirstGesture: () => void;
  setGhostFromScreen: (sx: number, sy: number) => void;
}

export class InputManager {
  private dragging = false;
  private moved = false;
  private lastX = 0;
  private lastY = 0;
  private downX = 0;
  private downY = 0;
  private disposed = false;
  private h: InputHandlers;

  constructor(handlers: InputHandlers) {
    this.h = handlers;
    const c = handlers.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    c.addEventListener('contextmenu', this.onContext);
    window.addEventListener('keydown', this.onKeyDown);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const c = this.h.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('wheel', this.onWheel);
    c.removeEventListener('contextmenu', this.onContext);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private local(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const r = this.h.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private onDown = (e: PointerEvent) => {
    this.h.onFirstGesture();
    if (e.button === 2) return; // handled by contextmenu
    const p = this.local(e);
    this.dragging = true;
    this.moved = false;
    this.lastX = this.downX = p.x;
    this.lastY = this.downY = p.y;
  };

  private onMove = (e: PointerEvent) => {
    const p = this.local(e);
    if (this.h.isPlacing()) this.h.setGhostFromScreen(p.x, p.y);
    if (!this.dragging) return;
    const dx = p.x - this.lastX;
    const dy = p.y - this.lastY;
    if (Math.abs(p.x - this.downX) > 4 || Math.abs(p.y - this.downY) > 4) this.moved = true;
    if (this.moved && !this.h.isPlacing()) {
      this.h.camera.panByScreen(dx, dy);
    }
    this.lastX = p.x;
    this.lastY = p.y;
  };

  private onUp = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;
    const p = this.local(e);
    if (this.h.isPlacing()) {
      if (!this.moved) {
        const w = this.h.camera.screenToWorld(p.x, p.y);
        this.h.onBackgroundClick(w.x, w.y); // place building
      }
      return;
    }
    if (this.moved) return; // was a pan
    // click → select or background
    const hit = this.h.pick(p.x, p.y);
    if (hit) this.h.onSelectEntity(hit);
    else {
      const w = this.h.camera.screenToWorld(p.x, p.y);
      this.h.onBackgroundClick(w.x, w.y);
      this.h.onSelectEntity(null);
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const p = this.local(e);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.h.camera.zoomBy(factor, p.x, p.y);
  };

  private onContext = (e: MouseEvent) => {
    e.preventDefault();
    const r = this.h.canvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const hit = this.h.pick(sx, sy);
    if (hit) this.h.onRadial(hit, e.clientX, e.clientY);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const map: Record<string, string> = {
      ' ': 'toggle-pause',
      '1': 'speed-1',
      '2': 'speed-2',
      '3': 'speed-3',
      '4': 'speed-4',
      f: 'follow-selected',
      r: 'reset-view',
      Escape: 'cancel',
      m: 'toggle-mute',
      n: 'toggle-names',
      p: 'screenshot',
    };
    const action = map[e.key];
    if (action) {
      if (e.key === ' ') e.preventDefault();
      this.h.onKey(action);
    }
  };
}
