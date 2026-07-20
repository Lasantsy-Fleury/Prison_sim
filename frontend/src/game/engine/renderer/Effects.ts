// Visual effects: particles (fire/smoke/blood/sparks), weather (rain/fog),
// day/night cycle, dynamic lighting and alarm flashes. Kept separate from the
// world simulation so it can be toggled or extended freely.

import type { Camera } from '../camera/Camera';
import type { World } from '../world/World';
import { lerp, clamp, smoothstep } from '../core/MathUtils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  grav: number;
  kind: 'spark' | 'smoke' | 'fire' | 'blood' | 'debris' | 'water' | 'star';
}

interface FireSource {
  x: number;
  y: number;
  intensity: number;
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

export interface LightInfo {
  ambient: number; // 0 (night) .. 1 (day)
  tint: string;
  darkness: number; // overlay alpha
}

export class Effects {
  particles: Particle[] = [];
  private fires: FireSource[] = [];
  rain: RainDrop[] = [];
  weather: 'clear' | 'rain' | 'fog' = 'clear';
  private fogPhase = 0;
  alarmFlash = 0;
  private maxParticles = 1400;

  constructor() {
    for (let i = 0; i < 400; i++) this.rain.push(this.makeDrop(1920, 1080));
  }

  private makeDrop(vw: number, vh: number): RainDrop {
    return {
      x: Math.random() * vw,
      y: Math.random() * vh,
      len: 8 + Math.random() * 10,
      speed: 600 + Math.random() * 400,
    };
  }

  setWeather(w: 'clear' | 'rain' | 'fog', cam: Camera) {
    this.weather = w;
    if (w === 'rain' && this.rain.length < 380) {
      for (let i = this.rain.length; i < 380; i++) this.rain.push(this.makeDrop(cam.vw, cam.vh));
    }
  }

  addFire(x: number, y: number, intensity = 1) {
    const f = this.fires.find((s) => Math.abs(s.x - x) < 6 && Math.abs(s.y - y) < 6);
    if (f) f.intensity = Math.max(f.intensity, intensity);
    else this.fires.push({ x, y, intensity });
  }

  removeFire(x: number, y: number) {
    this.fires = this.fires.filter((s) => Math.abs(s.x - x) > 6 || Math.abs(s.y - y) > 6);
  }

  triggerAlarm() {
    this.alarmFlash = 1.6;
  }

  private spawn(p: Particle) {
    if (this.particles.length >= this.maxParticles) this.particles.shift();
    this.particles.push(p);
  }

  burst(x: number, y: number, kind: Particle['kind'], count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 20 + Math.random() * 80;
      const colors: Record<Particle['kind'], string[]> = {
        spark: ['#ffd23f', '#ff9f1c', '#fff3b0'],
        smoke: ['#555', '#666', '#444', '#777'],
        fire: ['#ff5722', '#ff9800', '#ffc107'],
        blood: ['#c0152b', '#9b1020'],
        debris: ['#8a8f99', '#6b7280', '#a16207'],
        water: ['#7fd8ff', '#aee9ff'],
        star: ['#fff6b0', '#ffe066'],
      };
      const c = colors[kind][Math.floor(Math.random() * colors[kind].length)];
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (kind === 'fire' || kind === 'smoke' ? 30 : 0),
        life: 0,
        max: kind === 'smoke' || kind === 'fire' ? 0.8 + Math.random() * 1.2 : 0.4 + Math.random() * 0.6,
        size: kind === 'smoke' ? 4 + Math.random() * 6 : 1.5 + Math.random() * 2.5,
        color: c,
        grav: kind === 'blood' || kind === 'debris' || kind === 'star' ? 120 : -10,
        kind,
      });
    }
  }

  update(dt: number, world: World, cam: Camera) {
    this.fogPhase += dt * 0.15;

    if (this.alarmFlash > 0) this.alarmFlash -= dt;

    // emit from fire sources
    for (const f of this.fires) {
      this.burst(f.x, f.y - 4, 'fire', Math.ceil(2 * f.intensity));
      if (Math.random() < 0.4) this.burst(f.x + (Math.random() - 0.5) * 8, f.y - 2, 'smoke', 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.max) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'smoke') p.size += dt * 6;
    }

    if (this.weather === 'rain') {
      for (const d of this.rain) {
        d.y += d.speed * dt;
        d.x -= d.speed * 0.25 * dt;
        if (d.y > cam.vh) {
          d.y = -10;
          d.x = Math.random() * (cam.vw + 200);
        }
      }
    }
  }

  /** Particles drawn in world space (caller has applied camera transform). */
  drawWorld(ctx: CanvasRenderingContext2D, cam: Camera, world: World) {
    for (const p of this.particles) {
      const s = cam.worldToScreen(p.x, p.y);
      if (s.x < -20 || s.y < -20 || s.x > cam.vw + 20 || s.y > cam.vh + 20) continue;
      const t = 1 - p.life / p.max;
      ctx.globalAlpha = p.kind === 'smoke' ? t * 0.5 : t;
      ctx.fillStyle = p.color;
      if (p.kind === 'spark' || p.kind === 'star') {
        ctx.fillRect(s.x - p.size / 2, s.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Full-screen overlays: weather, day/night, alarm, vignette. */
  drawOver(ctx: CanvasRenderingContext2D, cam: Camera, world: World) {
    const light = this.lightInfo(world);

    // day/night darkness
    if (light.darkness > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = light.tint;
      ctx.globalAlpha = light.darkness;
      ctx.fillRect(0, 0, cam.vw, cam.vh);
      ctx.restore();
    }

    // light pools at night (additive)
    if (light.ambient < 0.8) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const b of world.buildings) {
        if (b.category !== 'room' || b.state !== 'OPERATIONAL') continue;
        if (b.type !== 'SECURITY' && b.type !== 'CANTEEN' && b.type !== 'VISITING') continue;
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const s = cam.worldToScreen(cx, cy);
        const r = (Math.max(b.w, b.h) * 0.9) * cam.zoom;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        g.addColorStop(0, 'rgba(255,224,150,0.30)');
        g.addColorStop(1, 'rgba(255,224,150,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // rain
    if (this.weather === 'rain') {
      ctx.strokeStyle = 'rgba(170,200,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of this.rain) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.25, d.y + d.len);
      }
      ctx.stroke();
    }

    // fog
    if (this.weather === 'fog') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 4; i++) {
        const fx = (cam.vw * (0.2 + i * 0.22)) + Math.sin(this.fogPhase + i) * 60;
        const fy = cam.vh * (0.3 + (i % 2) * 0.4);
        const r = 260;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
        g.addColorStop(0, 'rgba(220,228,235,0.18)');
        g.addColorStop(1, 'rgba(220,228,235,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // alarm flash (red vignette)
    if (this.alarmFlash > 0) {
      const pulse = 0.25 + 0.2 * Math.sin(this.alarmFlash * 12);
      const g = ctx.createRadialGradient(
        cam.vw / 2, cam.vh / 2, cam.vh * 0.3,
        cam.vw / 2, cam.vh / 2, cam.vh * 0.75,
      );
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, `rgba(255,0,0,${pulse})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cam.vw, cam.vh);
    }

    // vignette
    const vg = ctx.createRadialGradient(
      cam.vw / 2, cam.vh / 2, cam.vh * 0.5,
      cam.vw / 2, cam.vh / 2, cam.vh * 0.95,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cam.vw, cam.vh);
  }

  lightInfo(world: World): LightInfo {
    const h = world.time.hour;
    // day between 7 and 18, night outside; smooth transitions.
    const day = 1 - Math.max(smoothstep(18, 21, h), smoothstep(5, 7.5, 24 - Math.abs(h - 24)) > 0 ? 0 : 0);
    let ambient: number;
    if (h >= 7.5 && h <= 18) ambient = 1;
    else if (h < 7.5) ambient = clamp(lerp(0.32, 1, smoothstep(5, 7.5, h)), 0.32, 1);
    else ambient = clamp(lerp(1, 0.32, smoothstep(18, 21, h)), 0.32, 1);

    let tint = '#ffffff';
    let darkness = (1 - ambient) * 0.78;
    if (h >= 18 && h <= 20.5) {
      tint = '#6a5acd'; // dusk
      darkness = (1 - ambient) * 0.6;
    } else if (ambient < 0.7) {
      tint = '#22304f'; // night blue
    }
    void day;
    return { ambient, tint, darkness };
  }
}
