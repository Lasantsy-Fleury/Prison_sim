// Canvas renderer. Draws ground, buildings (with animated doors/lights/alarms),
// character sprites (with viewport culling), on-map indicators and speech bubbles.
// HUD itself is React; this is purely the world layer.

import type { Camera } from '../camera/Camera';
import type { World } from '../world/World';
import type { Effects } from './Effects';
import type { Entity, BuildingLike, BubbleKind } from '../world/types';
import { drawCharacter, CHAR_WORLD_W, CHAR_WORLD_H } from '../sprites/Avatar';
import { clamp } from '../core/MathUtils';

const BUILDING_COLORS: Record<string, string> = {
  CELL_BLOCK: '#5b6b7e',
  CORRIDOR: '#2a3645',
  YARD: '#3f8f6b',
  CANTEEN: '#c98a2a',
  INFIRMARY: '#e06a8a',
  SECURITY: '#f5a524',
  VISITING: '#7c6fd6',
  WORKSHOP: '#5b87a8',
  DOOR: '#8b9bab',
  CAMERA: '#38bdf8',
  FENCE: '#475569',
  BARBED_WIRE: '#475569',
  GUARD_POST: '#f5a524',
};

const BUBBLE_COLOR: Record<BubbleKind, string> = {
  talk: '#e8eef5',
  threat: '#ff6b6b',
  trade: '#ffd166',
  help: '#8ce99a',
  fight: '#ff5252',
  thought: '#b8a9ff',
  heart: '#ff8fab',
  angry: '#ff7b54',
};

export interface RenderOpts {
  selectedId: number | null;
  ghost: { type: string; x: number; y: number; w: number; h: number } | null;
  showNames: boolean;
  time: number; // sim time for animations
}

export class Renderer {
  draw(ctx: CanvasRenderingContext2D, world: World, cam: Camera, fx: Effects, opts: RenderOpts) {
    ctx.clearRect(0, 0, cam.vw, cam.vh);
    this.drawGround(ctx, world, cam);

    // Compute door-open state (any entity near a door).
    for (const b of world.buildings) {
      const door = world.grid.doorForBuilding(b.id);
      b.doorOpen = false;
      if (door) {
        const near = world.spatial.queryIds(door.cx, door.cy, 30);
        b.doorOpen = near.length > 0;
      }
      b.power = world.time.hour >= 18 || world.time.hour < 7;
    }

    this.drawBuildings(ctx, world, cam, opts.time);
    this.drawGhost(ctx, cam, opts.ghost);

    // entities (culled)
    for (const e of world.entities.values()) {
      const s = cam.worldToScreen(e.x, e.y);
      const margin = 40;
      if (s.x < -margin || s.y < -margin || s.x > cam.vw + margin || s.y > cam.vh + margin) continue;
      this.drawEntity(ctx, e, s, cam, opts);
    }

    fx.drawWorld(ctx, cam, world);
    fx.drawOver(ctx, cam, world);
  }

  private drawGround(ctx: CanvasRenderingContext2D, world: World, cam: Camera) {
    const top = cam.worldToScreen(0, 0);
    const bottom = cam.worldToScreen(world.grid.worldW, world.grid.worldH);
    ctx.fillStyle = '#11161d';
    ctx.fillRect(0, 0, cam.vw, cam.vh);
    ctx.fillStyle = '#19222c';
    ctx.fillRect(top.x, top.y, bottom.x - top.x, bottom.y - top.y);

    // tile grid (only when zoomed in enough)
    if (cam.zoom > 0.6) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const step = 40 * cam.zoom;
      const startX = top.x % step;
      for (let x = startX; x < cam.vw; x += step) {
        ctx.moveTo(x, Math.max(0, top.y));
        ctx.lineTo(x, Math.min(cam.vh, bottom.y));
      }
      const startY = top.y % step;
      for (let y = startY; y < cam.vh; y += step) {
        ctx.moveTo(Math.max(0, top.x), y);
        ctx.lineTo(Math.min(cam.vw, bottom.x), y);
      }
      ctx.stroke();
    }
  }

  private drawBuildings(ctx: CanvasRenderingContext2D, world: World, cam: Camera, time: number) {
    for (const b of world.buildings) {
      const tl = cam.worldToScreen(b.x, b.y);
      const w = b.w * cam.zoom;
      const h = b.h * cam.zoom;
      const color = BUILDING_COLORS[b.type] ?? '#5b6b7e';
      const isRoom = b.category === 'room';
      const dim = b.state === 'DAMAGED' || b.state === 'OFFLINE';

      ctx.save();
      if (dim) ctx.globalAlpha = 0.55;

      if (b.type === 'FENCE' || b.type === 'BARBED_WIRE') {
        ctx.strokeStyle = b.type === 'BARBED_WIRE' ? '#8a939e' : '#5b6470';
        ctx.lineWidth = 2;
        ctx.strokeRect(tl.x, tl.y, w, h);
        ctx.beginPath();
        const n = Math.max(2, Math.floor(w / 10));
        for (let i = 0; i <= n; i++) {
          const x = tl.x + (w * i) / n;
          ctx.moveTo(x, tl.y);
          ctx.lineTo(x, tl.y + h);
        }
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // body
      const r = Math.min(8, w / 4, h / 4);
      this.roundRect(ctx, tl.x, tl.y, w, h, r);
      const grad = ctx.createLinearGradient(tl.x, tl.y, tl.x, tl.y + h);
      grad.addColorStop(0, this.shade(color, 18));
      grad.addColorStop(1, this.shade(color, -22));
      ctx.fillStyle = grad;
      ctx.fill();

      // border
      ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
      ctx.strokeStyle = this.shade(color, 30);
      ctx.stroke();

      // lights at night
      if (b.power && isRoom && b.state === 'OPERATIONAL') {
        ctx.fillStyle = 'rgba(255,224,150,0.12)';
        this.roundRect(ctx, tl.x, tl.y, w, h, r);
        ctx.fill();
      }

      // door
      if (isRoom) {
        const door = world.grid.doorForBuilding(b.id);
        if (door) {
          const ds = cam.worldToScreen(door.cx, door.cy);
          const dw = Math.max(4, 8 * cam.zoom);
          const dh = Math.max(4, 8 * cam.zoom);
          ctx.fillStyle = b.doorOpen ? '#0c0f14' : this.shade(color, -40);
          ctx.fillRect(ds.x - dw / 2, ds.y - dh / 2, dw, dh);
          if (!b.doorOpen) {
            ctx.strokeStyle = '#0c0f14';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ds.x, ds.y - dh / 2);
            ctx.lineTo(ds.x, ds.y + dh / 2);
            ctx.stroke();
          }
        }
      }

      // camera sweep
      if (b.type === 'CAMERA' && b.state === 'OPERATIONAL') {
        const cx = tl.x + w / 2;
        const cy = tl.y + h / 2;
        const ang = time * 0.8;
        ctx.strokeStyle = 'rgba(56,189,248,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * 18, cy + Math.sin(ang) * 18);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // state overlays
      if (b.state === 'UNDER_CONSTRUCTION') {
        ctx.fillStyle = 'rgba(245,165,36,0.25)';
        this.roundRect(ctx, tl.x, tl.y, w, h, r);
        ctx.fill();
        const cx = tl.x + w / 2;
        const cy = tl.y + h / 2;
        const rad = Math.max(5, 7 * cam.zoom);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 2);
        ctx.strokeStyle = '#f5a524';
        ctx.lineWidth = Math.max(1.5, 1.6 * cam.zoom);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0.6, Math.PI * 1.6);
        ctx.stroke();
        ctx.restore();
      }
      if (b.alarm) {
        const p = 0.5 + 0.5 * Math.sin(time * 8);
        ctx.strokeStyle = `rgba(255,40,40,${0.4 + 0.5 * p})`;
        ctx.lineWidth = 2.5;
        this.roundRect(ctx, tl.x, tl.y, w, h, r);
        ctx.stroke();
      }

      // label
      if (cam.zoom > 0.5 && isRoom) {
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.font = `${Math.max(7, 9 * cam.zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(b.name, tl.x + w / 2, tl.y + 11 * cam.zoom);
      }
      ctx.restore();
    }
  }

  private drawGhost(ctx: CanvasRenderingContext2D, cam: Camera, ghost: RenderOpts['ghost']) {
    if (!ghost) return;
    const tl = cam.worldToScreen(ghost.x - ghost.w / 2, ghost.y - ghost.h / 2);
    const w = ghost.w * cam.zoom;
    const h = ghost.h * cam.zoom;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = BUILDING_COLORS[ghost.type] ?? '#5b6b7e';
    this.roundRect(ctx, tl.x, tl.y, w, h, 6);
    ctx.fill();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, tl.x, tl.y, w, h, 6);
    ctx.stroke();
    ctx.restore();
  }

  private drawEntity(ctx: CanvasRenderingContext2D, e: Entity, s: { x: number; y: number }, cam: Camera, opts: RenderOpts) {
    const scale = (CHAR_WORLD_W / 52) * cam.zoom;

    // shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, CHAR_WORLD_W * 0.5 * cam.zoom, CHAR_WORLD_W * 0.22 * cam.zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // gang tint dot at feet
    if (e.gang) {
      ctx.fillStyle = this.gangColor(e.gang);
      ctx.beginPath();
      ctx.arc(s.x, s.y - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // selection ring
    if (opts.selectedId === e.id) {
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y - CHAR_WORLD_H * 0.5 * cam.zoom, CHAR_WORLD_W * 0.7 * cam.zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawCharacter(ctx, e, {
      sx: s.x,
      sy: s.y,
      scale,
      facing: e.facing,
      alpha: e.kind === 'guard' ? 1 : 0.96,
    });

    // name
    if (opts.showNames || opts.selectedId === e.id) {
      ctx.fillStyle = opts.selectedId === e.id ? '#ffd23f' : 'rgba(255,255,255,0.7)';
      ctx.font = `${Math.max(8, 9 * cam.zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(e.name, s.x, s.y - CHAR_WORLD_H * cam.zoom - 4);
    }

    // on-map status pip
    if (opts.selectedId !== e.id && cam.zoom > 0.9) {
      const pip = this.statusPip(e);
      if (pip) {
        ctx.fillStyle = pip;
        ctx.beginPath();
        ctx.arc(s.x + CHAR_WORLD_W * 0.4 * cam.zoom, s.y - CHAR_WORLD_H * cam.zoom, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // speech bubble
    if (e.bubble && e.bubble.until > opts.time) {
      this.drawBubble(ctx, e, s, cam);
    }
  }

  private statusPip(e: Entity): string | null {
    if (e.state === 'fight') return '#ff5252';
    if (e.state === 'injured') return '#ff7043';
    if (e.state === 'panic') return '#ffd23f';
    if (e.state === 'sleep') return '#90a4ff';
    if (e.needs.hunger > 75) return '#ffa94d';
    if (e.needs.stress > 80) return '#ff6b6b';
    return null;
  }

  private drawBubble(ctx: CanvasRenderingContext2D, e: Entity, s: { x: number; y: number }, cam: Camera) {
    const text = e.bubble!.text;
    ctx.font = `${Math.max(9, 10 * cam.zoom)}px sans-serif`;
    const pad = 5;
    const maxW = 120;
    const lines = this.wrap(text, ctx, maxW);
    const lineH = 13;
    const bw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width))) + pad * 2;
    const bh = lines.length * lineH + pad;
    const bx = s.x - bw / 2;
    const by = s.y - CHAR_WORLD_H * cam.zoom - bh - 10;

    ctx.fillStyle = BUBBLE_COLOR[e.bubble!.kind] ?? '#fff';
    this.roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // tail
    ctx.beginPath();
    ctx.moveTo(s.x - 4, by + bh);
    ctx.lineTo(s.x + 4, by + bh);
    ctx.lineTo(s.x, by + bh + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, s.x, by + pad + 10 + i * lineH));
  }

  private wrap(text: string, ctx: CanvasRenderingContext2D, maxW: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  private gangColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `hsl(${h},70%,55%)`;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  private shade(hex: string, amt: number): string {
    if (hex.startsWith('rgb')) return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    r = clamp(r + amt, 0, 255);
    g = clamp(g + amt, 0, 255);
    b = clamp(b + amt, 0, 255);
    return `rgb(${r},${g},${b})`;
  }
}
