// GameEngine: the single entry point for the real-time simulation. Owns the
// world, camera, renderer, audio, input and every system, and drives them from a
// fixed-timestep loop (spec §1, §17).

import { World } from './world/World';
import { AStar } from './world/AStar';
import { Camera } from './camera/Camera';
import { Renderer } from './renderer/Renderer';
import { Effects } from './renderer/Effects';
import { SoundManager } from './audio/SoundManager';
import { EventBus } from './core/EventBus';
import { GameLoop } from './core/GameLoop';
import { Rng } from './core/Rng';
import { SimContext } from './core/SimContext';
import { AnimationManager } from './animations/AnimationManager';
import { SelectionManager } from './input/SelectionManager';
import { InputManager } from './input/InputManager';
import { NeedsSystem } from './systems/NeedsSystem';
import { SchedulerSystem } from './systems/SchedulerSystem';
import { AISystem } from './systems/AISystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { SocialSystem } from './systems/SocialSystem';
import { InventorySystem } from './systems/InventorySystem';
import { MovementSystem } from './systems/MovementSystem';
import { createEntity, resetIds } from './world/Entity';
import { randomAppearance, appearanceKey, PRESET_AVATARS } from './sprites/appearance';
import type { BuildingLike, Entity, Appearance, GamePhase } from './world/types';
import { CHAR_WORLD_H } from './sprites/Avatar';

export interface InmateSeed {
  id: number;
  name: string;
  age: number;
  block: string;
  status: string;
  intelligence: number;
  fear: number;
  aggressiveness: number;
  morale: number;
  behaviorScore: number;
  appearance?: Appearance;
}

export interface HudState {
  day: number;
  hour: number;
  minute: number;
  phase: GamePhase;
  population: number;
  guards: number;
  security: number;
  satisfaction: number;
  speed: number;
  paused: boolean;
  weather: 'clear' | 'rain' | 'fog';
  gangs: number;
  fights: number;
  selected: SelectedInfo | null;
  log: { id: number; level: string; text: string; icon?: string }[];
  notifications: { id: number; text: string; kind: string }[];
  objectives: { id: string; title: string; desc: string; value: number; target: number; done: boolean }[];
  external: { budget: number; securityLevel: number };
}

interface SelectedInfo {
  id: number;
  name: string;
  kind: string;
  state: string;
  mood: number;
  health: number;
  gang: string | null;
  reputation: number;
  needs: Record<string, number>;
  traits: Record<string, number>;
  psychology: { orientation: string; temperament: string };
  inventory: { money: number; items: { label: string; qty: number; contraband: boolean }[] };
}

export class GameEngine {
  world: World;
  grid: World['grid'];
  astar: AStar;
  camera: Camera;
  renderer = new Renderer();
  effects = new Effects();
  audio = new SoundManager();
  bus = new EventBus();
  selection: SelectionManager;
  rng: Rng;

  private anim = new AnimationManager();
  private needs = new NeedsSystem();
  private scheduler = new SchedulerSystem();
  private ai = new AISystem();
  private interaction = new InteractionSystem();
  private social = new SocialSystem();
  private inventory = new InventorySystem();
  private movement = new MovementSystem();

  private loop: GameLoop;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private input: InputManager | null = null;

  private ghost: { type: string; x: number; y: number; w: number; h: number } | null = null;
  private showNames = false;
  private external = { budget: 0, securityLevel: 0 };
  /** Set by the React layer to handle build placement on background click. */
  backgroundClickHandler: ((wx: number, wy: number) => void) | null = null;

  private hudSubs = new Set<(h: HudState) => void>();
  private hudTimer = 0;
  private stepTimer = 0;
  private prevDoor = new Map<number, boolean>();
  private metrics = { fightsToday: 0, lastDay: 1 };

  constructor(seed = 20260717, worldW = 1000, worldH = 640) {
    this.world = new World(seed, worldW, worldH);
    this.grid = this.world.grid;
    this.astar = new AStar(this.grid);
    this.camera = new Camera(worldW / 2, worldH / 2);
    this.camera.setWorld(worldW, worldH);
    this.selection = new SelectionManager(this.world);
    this.rng = this.world.rng;
    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: () => this.render(),
    });
    this.subscribe();
  }

  // ---------------- lifecycle ----------------
  mount(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.input = new InputManager({
      canvas,
      camera: this.camera,
      isPlacing: () => this.ghost != null,
      pick: (sx, sy) => this.pick(sx, sy),
      onSelectEntity: (e) => this.selection.select(e),
      onBackgroundClick: (wx, wy) => this.backgroundClickHandler?.(wx, wy),
      onRadial: (e, cx, cy) => this.bus.emit('ui:radial', { entity: e, x: cx, y: cy }),
      onKey: (a) => this.onKey(a),
      onFirstGesture: () => {
        this.audio.resume();
        this.audio.startAmbient();
      },
      setGhostFromScreen: (sx, sy) => this.updateGhostFromScreen(sx, sy),
    });
    this.resize();
  }

  start() {
    this.loop.start();
  }

  stop() {
    this.loop.stop();
    this.input?.dispose();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth ?? window.innerWidth;
    const h = parent?.clientHeight ?? window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.camera.setViewport(w, h);
  }

  // ---------------- bus wiring ----------------
  private subscribe() {
    this.bus.on('log', (p) => {
      this.world.log_(p.level, p.text, p.icon);
      if (p.level !== 'info') this.world.notify(p.text, p.level === 'critical' ? 'critical' : 'warn');
      if (p.text.startsWith('Bagarre')) this.metrics.fightsToday++;
    });
    this.bus.on('alarm', (p) => {
      this.effects.triggerAlarm();
      this.audio.play('alarm');
      // flag nearby buildings as alarming
      for (const b of this.world.buildings) {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        if (Math.hypot(cx - p.x, cy - p.y) < 200) b.alarm = true;
      }
    });
    this.bus.on('fight', (p) => {
      this.effects.burst(p.x, p.y, 'spark', 10);
      this.effects.burst(p.x, p.y, 'blood', 4);
    });
    this.bus.on('fire', (p) => {
      this.effects.addFire(p.x, p.y, 1.4);
      this.effects.burst(p.x, p.y, 'smoke', 12);
    });
    this.bus.on('explosion', (p) => {
      this.effects.burst(p.x, p.y, 'debris', 20);
      this.effects.burst(p.x, p.y, 'fire', 14);
      this.effects.burst(p.x, p.y, 'smoke', 10);
      this.effects.triggerAlarm();
    });
    this.bus.on('gang:formed', (p) => this.world.notify(`Gang formé : ${p.name}`, 'warn'));
    this.bus.on('gang:war', (p) => this.world.notify(`Guerre : ${p.a} vs ${p.b}`, 'critical'));
  }

  // ---------------- world setup ----------------
  setBuildings(list: BuildingLike[]) {
    this.world.setBuildings(list);
    for (const b of list) this.prevDoor.set(b.id, false);
    if (list.length === 0) this.ensureDefaultLayout();
  }

  private ensureDefaultLayout() {
    const layout: BuildingLike[] = [
      { id: 1, type: 'CELL_BLOCK', name: 'Bloc A', x: 60, y: 80, w: 200, h: 150, category: 'room', state: 'OPERATIONAL', capacity: 20, level: 1 },
      { id: 2, type: 'CELL_BLOCK', name: 'Bloc B', x: 60, y: 400, w: 200, h: 150, category: 'room', state: 'OPERATIONAL', capacity: 20, level: 1 },
      { id: 3, type: 'CANTEEN', name: 'Cantine', x: 360, y: 80, w: 180, h: 120, category: 'room', state: 'OPERATIONAL', capacity: 40, level: 1 },
      { id: 4, type: 'YARD', name: 'Cour', x: 360, y: 320, w: 220, h: 230, category: 'room', state: 'OPERATIONAL', capacity: 80, level: 1 },
      { id: 5, type: 'WORKSHOP', name: 'Atelier', x: 640, y: 80, w: 180, h: 150, category: 'room', state: 'OPERATIONAL', capacity: 30, level: 1 },
      { id: 6, type: 'INFIRMARY', name: 'Infirmerie', x: 640, y: 360, w: 150, h: 120, category: 'room', state: 'OPERATIONAL', capacity: 15, level: 1 },
      { id: 7, type: 'SECURITY', name: 'Sécurité', x: 830, y: 80, w: 120, h: 110, category: 'room', state: 'OPERATIONAL', capacity: 10, level: 1 },
      { id: 8, type: 'VISITING', name: 'Parloir', x: 830, y: 360, w: 120, h: 120, category: 'room', state: 'OPERATIONAL', capacity: 12, level: 1 },
    ];
    this.world.setBuildings(layout);
  }

  spawnInmates(seeds: InmateSeed[]) {
    if (seeds.length === 0) {
      // demo population so the world is alive immediately
      seeds = this.demoSeeds(24);
    }
    const cells = this.world.byType('CELL_BLOCK');
    seeds.forEach((s, i) => {
      if (s.status && s.status !== 'ACTIVE') return;
      const cell = cells[i % Math.max(1, cells.length)];
      const pos = cell ? this.cellSpot(cell, i) : this.randomWalkable();
      const appearance = s.appearance ?? randomAppearance(new Rng(s.id * 2654435761));
      const e = createEntity({
        kind: 'inmate',
        name: s.name,
        age: s.age,
        appearance,
        seed: s.id * 7919,
        x: pos.x,
        y: pos.y,
        block: s.block,
        cellId: cell?.id ?? null,
      });
      e.traits.intelligence = s.intelligence;
      e.traits.fear = s.fear;
      e.traits.aggressiveness = s.aggressiveness;
      e.traits.morale = s.morale;
      e.traits.discipline = Math.max(0, Math.min(100, s.behaviorScore));
      e.appearanceKey = appearanceKey(appearance);
      this.world.add(e);
    });
    this.bus.emit('log', { level: 'info', text: `${this.world.count('inmate')} détenus en vie.`, icon: 'inmate' });
  }

  spawnGuards(count: number) {
    const sec = this.world.byType('SECURITY')[0];
    for (let i = 0; i < count; i++) {
      const pos = sec ? this.cellSpot(sec, i) : this.randomWalkable();
      const e = createEntity({ kind: 'guard', name: undefined, seed: 5000 + i * 104729, x: pos.x, y: pos.y });
      e.traits.intelligence = 60 + (i % 30);
      this.world.add(e);
    }
  }

  private demoSeeds(n: number): InmateSeed[] {
    const first = ['Tony', 'Marco', 'Sam', 'Bruno', 'Leo', 'Viktor', 'Diego', 'Nico', 'Hugo', 'Karim'];
    const last = ['Moretti', 'Rossi', 'Bernard', 'Nguyen', 'Garcia', 'Petrov', 'Hassan', 'Lopez', 'Schmidt', 'Okafor'];
    const out: InmateSeed[] = [];
    for (let i = 0; i < n; i++) {
      out.push({
        id: 100000 + i,
        name: `${first[i % first.length]} ${last[(i * 3) % last.length]}`,
        age: 19 + (i % 45),
        block: String.fromCharCode(65 + (i % 4)),
        status: 'ACTIVE',
        intelligence: 20 + ((i * 37) % 75),
        fear: 10 + ((i * 53) % 80),
        aggressiveness: 10 + ((i * 71) % 85),
        morale: 20 + ((i * 29) % 70),
        behaviorScore: 30 + ((i * 41) % 60),
      });
    }
    return out;
  }

  /** Add a freshly-created inmate (from the avatar creator). */
  addInmate(opts: { name: string; age: number; appearance: Appearance; traits?: Partial<InmateSeed> }) {
    const cells = this.world.byType('CELL_BLOCK');
    const pos = cells.length ? this.cellSpot(cells[0], this.world.count('inmate')) : this.randomWalkable();
    const e = createEntity({
      kind: 'inmate',
      name: opts.name,
      age: opts.age,
      appearance: opts.appearance,
      seed: (Date.now() & 0xffff) ^ this.world.count('inmate') * 2654435761,
      x: pos.x,
      y: pos.y,
      block: 'A',
    });
    if (opts.traits) {
      if (opts.traits.aggressiveness != null) e.traits.aggressiveness = opts.traits.aggressiveness;
      if (opts.traits.intelligence != null) e.traits.intelligence = opts.traits.intelligence;
    }
    this.world.add(e);
    this.bus.emit('log', { level: 'info', text: `${e.name} a rejoint la prison.`, icon: 'new' });
    return e;
  }

  /** Spawn an inmate using one of the preset avatars (for quick testing). */
  addPresetInmate(index: number) {
    const p = PRESET_AVATARS[index % PRESET_AVATARS.length];
    return this.addInmate({ name: p.name, age: 25 + (index % 30), appearance: p.appearance });
  }

  // ---------------- simulation ----------------
  private update(dt: number) {
    const w = this.world;
    w.advance(dt);
    if (w.time.day !== this.metrics.lastDay) {
      this.metrics.lastDay = w.time.day;
      this.metrics.fightsToday = 0;
    }
    w.rebuildSpatial();

    const ctx: SimContext = {
      world: w,
      bus: this.bus,
      rng: this.rng,
      grid: this.grid,
      astar: this.astar,
      effects: this.effects,
      audio: this.audio,
      camera: this.camera,
      dt,
      time: w.time.simTime,
    };

    this.scheduler.update(ctx);
    this.ai.update(ctx);
    this.movement.update(ctx);
    this.needs.update(ctx);
    this.interaction.update(ctx);
    this.social.update(ctx);
    this.inventory.update(ctx);
    this.anim.update(w, dt);
    this.effects.update(dt, w, this.camera);

    this.doorSounds();
    this.footsteps(dt);

    // HUD push (throttled)
    this.hudTimer += dt;
    if (this.hudTimer >= 0.2) {
      this.hudTimer = 0;
      this.pushHud();
    }
  }

  private doorSounds() {
    for (const b of this.world.buildings) {
      const open = !!b.doorOpen;
      const prev = this.prevDoor.get(b.id) ?? false;
      if (open && !prev) this.audio.play('door');
      this.prevDoor.set(b.id, open);
    }
  }

  private footsteps(dt: number) {
    this.stepTimer -= dt;
    if (this.stepTimer > 0) return;
    this.stepTimer = 0.36;
    let moving = false;
    for (const e of this.world.entities.values()) {
      if ((e.state === 'walk' || e.state === 'run' || e.state === 'panic') && e.path.length) {
        moving = true;
        break;
      }
    }
    if (moving) this.audio.play('footstep', 0.5);
  }

  // ---------------- render ----------------
  private render() {
    if (!this.ctx || !this.canvas) return;
    this.camera.update(1 / 60);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // sync weather audio
    this.audio.setRain(this.effects.weather === 'rain');

    this.renderer.draw(this.ctx, this.world, this.camera, this.effects, {
      selectedId: this.selection.selectedId,
      ghost: this.ghost,
      showNames: this.showNames || this.camera.zoom > 1.1,
      time: this.world.time.simTime,
    });
  }

  // ---------------- picking ----------------
  pick(sx: number, sy: number): Entity | null {
    let best: Entity | null = null;
    let bestD = Infinity;
    for (const e of this.world.entities.values()) {
      const s = this.camera.worldToScreen(e.x, e.y);
      const r = CHAR_WORLD_H * 0.7 * this.camera.zoom;
      const d = Math.hypot(s.x - sx, s.y - sy);
      if (d < r && d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  // ---------------- controls ----------------
  setSpeed(mult: number) {
    this.loop.setSpeed(mult);
    this.bus.emit('engine:speed', mult);
  }
  getSpeed() {
    return this.loop.getSpeed();
  }
  togglePause() {
    this.loop.setPaused(!this.loop.isPaused());
  }
  followSelected() {
    const e = this.selection.get();
    this.camera.followEntity(e);
  }
  resetView() {
    this.camera.follow = null;
    this.camera.centerOn(this.world.grid.worldW / 2, this.world.grid.worldH / 2);
    this.camera.setZoom(1);
  }
  setGhost(g: { type: string; w: number; h: number } | null, wx?: number, wy?: number) {
    if (g && wx != null && wy != null) this.ghost = { ...g, x: wx, y: wy };
    else if (g) this.ghost = { ...g, x: this.ghost?.x ?? 500, y: this.ghost?.y ?? 320 };
    else this.ghost = null;
  }
  private updateGhostFromScreen(sx: number, sy: number) {
    if (!this.ghost) return;
    const w = this.camera.screenToWorld(sx, sy);
    this.ghost.x = w.x;
    this.ghost.y = w.y;
  }
  clearGhost() {
    this.ghost = null;
  }
  toggleMute() {
    this.audio.setEnabled(!this.audio.isEnabled());
  }
  toggleNames() {
    this.showNames = !this.showNames;
  }
  setWeather(w: 'clear' | 'rain' | 'fog') {
    this.effects.setWeather(w, this.camera);
    this.world.weather = w;
    this.bus.emit('weather', { kind: w });
    if (w === 'rain') this.world.notify('Il pleut sur la prison.', 'info');
  }
  setExternalStats(budget: number, securityLevel: number) {
    this.external.budget = budget;
    this.external.securityLevel = securityLevel;
  }

  private onKey(action: string) {
    switch (action) {
      case 'toggle-pause':
        this.togglePause();
        break;
      case 'speed-1':
        this.setSpeed(1);
        break;
      case 'speed-2':
        this.setSpeed(2);
        break;
      case 'speed-3':
        this.setSpeed(3);
        break;
      case 'speed-4':
        this.setSpeed(0.5);
        break;
      case 'follow-selected':
        this.followSelected();
        break;
      case 'reset-view':
        this.resetView();
        break;
      case 'toggle-mute':
        this.toggleMute();
        break;
      case 'toggle-names':
        this.toggleNames();
        break;
    }
  }

  // ---------------- HUD ----------------
  onHud(cb: (h: HudState) => void) {
    this.hudSubs.add(cb);
    cb(this.getHudState());
    return () => {
      this.hudSubs.delete(cb);
    };
  }

  getHudState(): HudState {
    const w = this.world;
    const phase = this.phase(w.time.hour);
    const fights = w.list('inmate').filter((e) => e.state === 'fight').length;
    const sel = this.selection.get();
    let hygieneBad = 0;
    let n = 0;
    for (const e of w.list('inmate')) {
      n++;
      if (e.needs.hygiene > 50) hygieneBad++;
    }
    const hygienePct = n ? Math.round((hygieneBad / n) * 100) : 0;

    const objectives = [
      { id: 'peace', title: 'Maintenir la paix', desc: 'Moins de 3 bagarres/jour', value: this.metrics.fightsToday, target: 3, done: this.metrics.fightsToday <= 3 },
      { id: 'health', title: 'Hygiène', desc: 'Moins de 30% malpropres', value: hygienePct, target: 30, done: hygienePct <= 30 },
      { id: 'economy', title: 'Budget positif', desc: 'Budget > 0', value: this.external.budget, target: 0, done: this.external.budget > 0 },
      { id: 'escape', title: 'Zéro évasion', desc: 'Aucune évasion', value: 0, target: 0, done: true },
    ];

    return {
      day: w.time.day,
      hour: w.time.hour,
      minute: w.time.minute,
      phase,
      population: w.count('inmate'),
      guards: w.count('guard'),
      security: this.computeSecurity(fights),
      satisfaction: w.averageMood(),
      speed: this.getSpeed(),
      paused: this.loop.isPaused(),
      weather: this.effects.weather,
      gangs: w.gangs.size,
      fights,
      selected: sel
        ? {
            id: sel.id,
            name: sel.name,
            kind: sel.kind,
            state: sel.state,
            mood: sel.mood,
            health: Math.round(sel.health),
            gang: sel.gang,
            reputation: Math.round(sel.reputation),
            needs: {
              hunger: Math.round(sel.needs.hunger),
              fatigue: Math.round(sel.needs.fatigue),
              hygiene: Math.round(sel.needs.hygiene),
              stress: Math.round(sel.needs.stress),
              health: Math.round(sel.needs.health),
              loneliness: Math.round(sel.needs.loneliness),
              security: Math.round(sel.needs.security),
              freedom: Math.round(sel.needs.freedom),
              confidence: Math.round(sel.needs.confidence),
              respect: Math.round(sel.needs.respect),
            },
            traits: {
              intelligence: sel.traits.intelligence,
              fear: sel.traits.fear,
              aggressiveness: sel.traits.aggressiveness,
              morale: sel.traits.morale,
              discipline: sel.traits.discipline,
              empathy: sel.traits.empathy,
              sociability: sel.traits.sociability,
            },
            psychology: { orientation: sel.psychology.orientation, temperament: sel.psychology.temperament },
            inventory: {
              money: sel.inventory.money,
              items: sel.inventory.items.map((i) => ({ label: i.label, qty: i.qty, contraband: i.contraband })),
            },
          }
        : null,
      log: w.log.slice(-30).reverse().map((l) => ({ id: l.id, level: l.level, text: l.text, icon: l.icon })),
      notifications: w.notifications.slice(-12).reverse().map((nn) => ({ id: nn.id, text: nn.text, kind: nn.kind })),
      objectives,
      external: { ...this.external },
    };
  }

  private computeSecurity(fights: number): number {
    const g = this.world.count('guard');
    return Math.max(0, Math.min(100, Math.round(45 + g * 1.5 - fights * 6 - this.world.count('inmate') * 0.1)));
  }

  private phase(hour: number): GamePhase {
    if (hour < 6 || hour >= 22) return 'NUIT';
    if (hour < 11) return 'MATIN';
    if (hour < 18) return 'JOUR';
    return 'SOIR';
  }

  private pushHud() {
    const h = this.getHudState();
    for (const cb of this.hudSubs) cb(h);
  }

  // ---------------- helpers ----------------
  private cellSpot(b: BuildingLike, i: number) {
    const cols = Math.max(1, Math.floor(b.w / 30));
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = b.x + 16 + c * 28;
    const y = b.y + 20 + r * 28;
    return this.grid.nearestWalkable(x, y);
  }

  private randomWalkable(): { x: number; y: number } {
    for (let i = 0; i < 30; i++) {
      const x = this.rng.range(40, this.world.grid.worldW - 40);
      const y = this.rng.range(40, this.world.grid.worldH - 40);
      if (this.grid.isWalkable(this.grid.toTileX(x), this.grid.toTileY(y))) return { x, y };
    }
    return { x: this.world.grid.worldW / 2, y: this.world.grid.worldH / 2 };
  }
}
