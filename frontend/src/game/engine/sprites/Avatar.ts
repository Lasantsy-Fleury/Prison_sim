// Procedural character renderer. Each entity is drawn from its Appearance data
// (no image assets). The static upper body is cached per appearance+facing; limbs
// are redrawn every frame so walk/run/fight cycles stay fluid and cheap.

import type { Entity, Appearance, AnimState } from '../world/types';
import { SKIN_TONES, HAIR_COLORS, CLOTHES_COLORS, HAIR_STYLES, HATS, appearanceKey } from './appearance';

const BW = 52; // base canvas width (px)
const BH = 70; // base canvas height (px)
const FOOT_Y = BH - 4; // feet position inside base canvas

interface Metrics {
  bodyW: number;
  torsoTop: number;
  hipY: number;
  headR: number;
  headY: number;
  shoulderY: number;
  armLen: number;
  legLen: number;
}

function metrics(a: Appearance): Metrics {
  const wMul = [0.82, 1, 1.14, 1.32][a.build] ?? 1;
  const hMul = [0.86, 1, 1.16][a.height] ?? 1;
  const bodyW = 13 * wMul;
  const hipY = -15;
  const torsoTop = -34 * hMul;
  const headR = 6.3;
  const headY = torsoTop - headR - 1;
  return {
    bodyW,
    torsoTop,
    hipY,
    headR,
    headY,
    shoulderY: torsoTop + 2,
    armLen: 14,
    legLen: 15,
  };
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}

const baseCache = new Map<string, HTMLCanvasElement>();

function buildBase(e: Entity): HTMLCanvasElement {
  const key = e.appearanceKey + '|' + e.facing;
  const cached = baseCache.get(key);
  if (cached) return cached;

  const c = document.createElement('canvas');
  c.width = BW;
  c.height = BH;
  const g = c.getContext('2d')!;
  const a = e.appearance;
  const m = metrics(a);
  const skin = SKIN_TONES[a.skin];
  const clothes = CLOTHES_COLORS[a.clothes];

  g.save();
  g.translate(BW / 2, FOOT_Y); // origin at feet, up = negative

  // shadow handled by renderer; draw lower-body (pants) block
  g.fillStyle = shade(clothes, -28);
  rr(g, -m.bodyW / 2, m.hipY - 2, m.bodyW, -m.hipY + 2, 4);
  g.fill();

  // torso
  g.fillStyle = clothes;
  rr(g, -m.bodyW / 2, m.torsoTop, m.bodyW, m.hipY - m.torsoTop, 5);
  g.fill();
  // chest shading
  g.fillStyle = shade(clothes, -16);
  rr(g, -m.bodyW / 2, m.torsoTop + (m.hipY - m.torsoTop) * 0.55, m.bodyW, (m.hipY - m.torsoTop) * 0.45, 4);
  g.fill();
  // collar
  g.fillStyle = shade(clothes, 18);
  rr(g, -m.bodyW * 0.32, m.torsoTop - 1, m.bodyW * 0.64, 4, 2);
  g.fill();

  // tattoo (left forearm area on torso side)
  if (a.tattoo) {
    g.strokeStyle = shade(skin, -50);
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-m.bodyW / 2 + 2, m.shoulderY + 5);
    g.lineTo(-m.bodyW / 2 + 4, m.hipY - 3);
    g.stroke();
  }

  // neck
  g.fillStyle = shade(skin, -12);
  rr(g, -2.4, m.headY + m.headR - 1, 4.8, 4, 1.5);
  g.fill();

  // head
  g.fillStyle = skin;
  g.beginPath();
  g.arc(0, m.headY, m.headR, 0, Math.PI * 2);
  g.fill();
  // ear
  g.beginPath();
  g.arc(m.headR - 0.5, m.headY + 0.5, 1.6, 0, Math.PI * 2);
  g.fill();

  // face features
  g.fillStyle = '#1a1a1a';
  g.beginPath();
  g.arc(-2.4, m.headY - 0.5, 1.1, 0, Math.PI * 2); // eye L
  g.arc(2.4, m.headY - 0.5, 1.1, 0, Math.PI * 2); // eye R
  g.fill();
  // mouth
  g.strokeStyle = shade(skin, -55);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-1.8, m.headY + 3);
  g.lineTo(1.8, m.headY + 3);
  g.stroke();

  // elder wrinkles
  if (a.ageLook === 3) {
    g.strokeStyle = shade(skin, -30);
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(-3.5, m.headY - 2);
    g.lineTo(-1.5, m.headY - 2.4);
    g.moveTo(3.5, m.headY - 2);
    g.lineTo(1.5, m.headY - 2.4);
    g.stroke();
  }
  // scar
  if (a.scar) {
    g.strokeStyle = '#b03a3a';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(2.6, m.headY - 3);
    g.lineTo(4, m.headY + 2.5);
    g.stroke();
  }

  // facial hair
  if (a.facialHair === 2 || a.facialHair === 3) {
    g.fillStyle = HAIR_COLORS[a.hairColor];
    rr(g, -m.headR + 1, m.headY + 2.5, m.headR * 2 - 2, 3.2, 1.6);
    g.fill();
    if (a.facialHair === 3) {
      g.fillRect(-1.2, m.headY + 1, 2.4, 3.5); // goatee
    }
  } else if (a.facialHair === 1) {
    g.strokeStyle = HAIR_COLORS[a.hairColor];
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-3.2, m.headY + 3);
    g.lineTo(3.2, m.headY + 3);
    g.stroke();
  }

  // hair
  const hc = HAIR_COLORS[a.hairColor];
  g.fillStyle = hc;
  const style = HAIR_STYLES[a.hairStyle];
  if (style !== 'bald') {
    if (style === 'buzz' || style === 'short' || style === 'curly') {
      g.beginPath();
      g.arc(0, m.headY - 1, m.headR + 0.6, Math.PI, 0);
      g.fill();
    } else if (style === 'long') {
      g.beginPath();
      g.arc(0, m.headY - 1, m.headR + 1, Math.PI, 0);
      g.fill();
      g.fillRect(-m.headR - 1, m.headY - 1, 3, 7);
      g.fillRect(m.headR - 2, m.headY - 1, 3, 7);
    } else if (style === 'mohawk') {
      g.fillRect(-1.6, m.headY - m.headR - 5, 3.2, 7);
    } else if (style === 'bun') {
      g.beginPath();
      g.arc(0, m.headY - m.headR - 2, 2.4, 0, Math.PI * 2);
      g.fill();
    } else if (style === 'afro') {
      g.beginPath();
      g.arc(0, m.headY - 1, m.headR + 2.4, Math.PI, 0);
      g.fill();
    } else if (style === 'ponytail') {
      g.beginPath();
      g.arc(0, m.headY - 1, m.headR + 0.6, Math.PI, 0);
      g.fill();
      g.fillRect(m.headR - 1, m.headY - 2, 2.5, 8);
    }
  }

  // hat
  const hat = HATS[a.hat];
  if (hat === 'cap') {
    g.fillStyle = shade(clothes, -10);
    g.beginPath();
    g.arc(0, m.headY - 1, m.headR + 0.8, Math.PI, 0);
    g.fill();
    g.fillRect(0, m.headY, m.headR + 3, 2); // brim to the right (facing)
  } else if (hat === 'beanie') {
    g.fillStyle = '#3a3f52';
    g.beginPath();
    g.arc(0, m.headY - 0.5, m.headR + 1, Math.PI, 0);
    g.fill();
    g.fillRect(-m.headR - 1, m.headY - 0.5, m.headR * 2 + 2, 2.4);
  } else if (hat === 'bandana') {
    g.fillStyle = '#b0303a';
    g.beginPath();
    g.arc(0, m.headY - 1, m.headR + 0.5, Math.PI + 0.4, -0.4);
    g.fill();
  }

  // glasses
  if (a.glasses) {
    g.strokeStyle = '#15171c';
    g.lineWidth = 1;
    g.strokeRect(-4, m.headY - 1.6, 3.4, 2.6);
    g.strokeRect(0.6, m.headY - 1.6, 3.4, 2.6);
    g.beginPath();
    g.moveTo(-0.6, m.headY - 0.3);
    g.lineTo(0.6, m.headY - 0.3);
    g.stroke();
  }

  // accessory: earring / necklace
  if (a.accessory === 3) {
    g.fillStyle = '#ffd966';
    g.beginPath();
    g.arc(-m.headR + 0.5, m.headY + 1.5, 1, 0, Math.PI * 2);
    g.fill();
  } else if (a.accessory === 4) {
    g.strokeStyle = '#ffd966';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(0, m.torsoTop + 4, 3, 0.1, Math.PI - 0.1);
    g.stroke();
  }

  g.restore();

  if (baseCache.size > 1200) baseCache.clear();
  baseCache.set(key, c);
  return c;
}

function drawLimbs(g: CanvasRenderingContext2D, e: Entity, phase: number, state: AnimState, m: Metrics, a: Appearance) {
  const skin = SKIN_TONES[a.skin];
  const clothes = CLOTHES_COLORS[a.clothes];
  const pants = shade(clothes, -28);
  const limbW = 3.4;

  let swing = 0;
  let armSwing = 0;
  let crouch = 0;
  if (state === 'walk') {
    swing = Math.sin(phase * Math.PI) * 4.5;
    armSwing = Math.sin(phase * Math.PI) * 3.5;
  } else if (state === 'run') {
    swing = Math.sin(phase * Math.PI) * 7;
    armSwing = Math.sin(phase * Math.PI) * 6;
  } else if (state === 'idle' || state === 'talk' || state === 'eat') {
    swing = Math.sin(phase * Math.PI * 0.4) * 0.8;
  }

  // ---- legs ----
  g.strokeStyle = pants;
  g.lineWidth = limbW;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-m.bodyW * 0.22, m.hipY);
  g.lineTo(-m.bodyW * 0.22 + swing, 0);
  g.moveTo(m.bodyW * 0.22, m.hipY);
  g.lineTo(m.bodyW * 0.22 - swing, 0);
  g.stroke();
  // shoes
  g.fillStyle = '#23262e';
  g.beginPath();
  g.ellipse(-m.bodyW * 0.22 + swing, 0, 2.4, 1.4, 0, 0, Math.PI * 2);
  g.ellipse(m.bodyW * 0.22 - swing, 0, 2.4, 1.4, 0, 0, Math.PI * 2);
  g.fill();

  // ---- arms ----
  g.strokeStyle = clothes;
  g.lineWidth = limbW;
  const shoulderX = m.bodyW * 0.5;
  if (state === 'fight') {
    const punch = (Math.sin(phase * Math.PI * 2) * 0.5 + 0.5) * 6;
    // left arm guard up
    g.beginPath();
    g.moveTo(-shoulderX, m.shoulderY);
    g.lineTo(-shoulderX - 2, m.shoulderY - 6);
    // right arm punch forward
    g.moveTo(shoulderX, m.shoulderY);
    g.lineTo(shoulderX + punch, m.shoulderY + 1);
    g.stroke();
    g.fillStyle = skin;
    g.beginPath();
    g.arc(shoulderX + punch, m.shoulderY + 1, 2, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (state === 'arrested' || state === 'escort') {
    // hands behind back
    g.beginPath();
    g.moveTo(-shoulderX, m.shoulderY);
    g.lineTo(-shoulderX - 1, m.shoulderY + 7);
    g.moveTo(shoulderX, m.shoulderY);
    g.lineTo(shoulderX + 1, m.shoulderY + 7);
    g.stroke();
    g.strokeStyle = '#cfcfcf';
    g.beginPath();
    g.moveTo(-shoulderX - 1, m.shoulderY + 7);
    g.lineTo(shoulderX + 1, m.shoulderY + 7);
    g.stroke();
    return;
  }
  if (state === 'work' || state === 'shower') {
    // arms forward
    g.beginPath();
    g.moveTo(-shoulderX, m.shoulderY);
    g.lineTo(-shoulderX - 3, m.shoulderY + 4);
    g.moveTo(shoulderX, m.shoulderY);
    g.lineTo(shoulderX + 3, m.shoulderY + 4);
    g.stroke();
    return;
  }
  if (state === 'eat') {
    g.beginPath();
    g.moveTo(-shoulderX, m.shoulderY);
    g.lineTo(-shoulderX - 2, m.shoulderY - 7);
    g.moveTo(shoulderX, m.shoulderY);
    g.lineTo(shoulderX + 1, m.shoulderY - 6);
    g.stroke();
    return;
  }
  // default: arms swing opposite to legs
  g.beginPath();
  g.moveTo(-shoulderX, m.shoulderY);
  g.lineTo(-shoulderX - armSwing * 0.3, m.shoulderY + 7 + armSwing * 0.2);
  g.moveTo(shoulderX, m.shoulderY);
  g.lineTo(shoulderX + armSwing * 0.3, m.shoulderY + 7 - armSwing * 0.2);
  g.stroke();
}

export interface DrawOptions {
  sx: number;
  sy: number;
  scale: number;
  facing: 1 | -1;
  alpha?: number;
  tintFlash?: number; // 0..1 red overlay (hit)
}

/** Draw a character at screen coordinates. */
export function drawCharacter(ctx: CanvasRenderingContext2D, e: Entity, opts: DrawOptions) {
  const base = buildBase(e);
  const m = metrics(e.appearance);
  const state = e.state;

  let bob = 0;
  if (state === 'walk') bob = -Math.abs(Math.sin(e.animPhase * Math.PI)) * 1.4;
  else if (state === 'run') bob = -Math.abs(Math.sin(e.animPhase * Math.PI)) * 2.2;
  else if (state === 'idle' || state === 'talk') bob = Math.sin(e.animPhase * 2) * 0.6;

  ctx.save();
  ctx.translate(opts.sx, opts.sy + bob);
  ctx.scale(opts.facing, 1);
  ctx.scale(opts.scale, opts.scale);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;

  ctx.drawImage(base, -BW / 2, -FOOT_Y);
  drawLimbs(ctx, e, e.animPhase, state, m, e.appearance);

  // weapon if shiv in inventory
  // state overlays
  if (state === 'sleep') {
    ctx.fillStyle = '#cfe8ff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Z', 6, -m.headY - 6);
    ctx.fillText('z', 9, -m.headY - 12);
  }
  if (state === 'panic') {
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('!', 4, -m.headY - 4);
  }
  if (state === 'injured') {
    ctx.fillStyle = 'rgba(200,30,30,0.85)';
    ctx.beginPath();
    ctx.arc(3, m.headY, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (opts.tintFlash && opts.tintFlash > 0) {
    ctx.globalAlpha = (opts.alpha ?? 1) * opts.tintFlash;
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(-BW / 2, -FOOT_Y, BW, FOOT_Y);
  }
  ctx.restore();
}

export const CHAR_WORLD_W = 18; // world units wide when scale=1 (renderer multiplies by zoom)
export const CHAR_WORLD_H = (BH / BW) * CHAR_WORLD_W;

/** Render a standalone avatar (used by the creator preview & portraits). */
export function drawAvatarPreview(
  canvas: HTMLCanvasElement,
  appearance: Appearance,
  phase = 0,
  facing: 1 | -1 = 1,
  state: AnimState = 'idle',
) {
  const e = {
    id: 0,
    kind: 'inmate',
    appearance,
    appearanceKey: appearanceKey(appearance),
    facing,
    state,
    animPhase: phase,
    x: 0,
    y: 0,
  } as unknown as Entity;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sx = canvas.width / 2;
  const sy = canvas.height - 10;
  const scale = (canvas.width / BW) * 1.5;
  drawCharacter(ctx, e, { sx, sy, scale, facing });
}
