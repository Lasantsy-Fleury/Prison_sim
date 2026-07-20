// SoundManager — fully synthesized via WebAudio (no audio assets required).
// Designed to be extended: call `register` to add new named sounds.

type SoundFn = (ctx: AudioContext, master: GainNode, t: number) => void;

export class SoundManager {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private sounds = new Map<string, SoundFn>();
  private enabled = true;
  private volume = 0.6;
  private ambientNodes: { stop: () => void } | null = null;
  private rainNode: { stop: () => void } | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    this.registerDefaults();
  }

  /** Must be called from a user gesture to satisfy autoplay policies. */
  resume() {
    if (!this.ac) this.init();
    this.ac?.resume().catch(() => {});
  }

  private init() {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      this.ac = new Ctx();
      this.master = this.ac.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ac.destination);
      // pre-build a noise buffer
      const len = this.ac.sampleRate * 1;
      const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    } catch {
      this.ac = null;
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? this.volume : 0;
  }

  isEnabled() {
    return this.enabled;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.enabled ? this.volume : 0;
  }

  /** Add or override a named sound. */
  register(name: string, fn: SoundFn) {
    this.sounds.set(name, fn);
  }

  play(name: string, gain = 1) {
    if (!this.enabled) return;
    if (!this.ac) this.init();
    if (!this.ac || !this.master) return;
    if (this.ac.state === 'suspended') this.ac.resume().catch(() => {});
    const fn = this.sounds.get(name);
    if (!fn) return;
    try {
      fn(this.ac, this.master, this.ac.currentTime);
    } catch {
      /* ignore audio errors */
    }
  }

  startAmbient() {
    if (!this.enabled || !this.ac || this.ambientNodes) return;
    if (!this.ac) this.init();
    if (!this.ac || !this.master || !this.noiseBuffer) return;
    const ctx = this.ac;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    g.connect(this.master);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 55;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 58.7;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(g);
    o1.start();
    o2.start();
    this.ambientNodes = {
      stop: () => {
        try {
          o1.stop();
          o2.stop();
        } catch {}
      },
    };
  }

  setRain(on: boolean) {
    if (on && !this.rainNode && this.ac && this.master && this.noiseBuffer) {
      const ctx = this.ac;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      const g = ctx.createGain();
      g.gain.value = 0.06;
      src.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      src.start();
      this.rainNode = { stop: () => { try { src.stop(); } catch {} } };
    } else if (!on && this.rainNode) {
      this.rainNode.stop();
      this.rainNode = null;
    }
  }

  private registerDefaults() {
    this.register('footstep', (ctx, master, t) => {
      if (!this.noiseBuffer) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 300;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      src.connect(lp);
      lp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + 0.1);
    });

    this.register('door', (ctx, master, t) => {
      if (!this.noiseBuffer) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(400, t);
      bp.frequency.linearRampToValueAtTime(900, t + 0.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + 0.36);
    });

    this.register('fight', (ctx, master, t) => {
      if (!this.noiseBuffer) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      src.connect(hp);
      hp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + 0.26);
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.2);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.2, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(og);
      og.connect(master);
      o.start(t);
      o.stop(t + 0.23);
    });

    this.register('cry', (ctx, master, t) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(700, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.46);
    });

    this.register('talk', (ctx, master, t) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(420, t);
      o.frequency.linearRampToValueAtTime(520, t + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.13);
    });

    this.register('radio', (ctx, master, t) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      g.connect(master);
      for (const f of [880, 660]) {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = f;
        o.connect(g);
        o.start(t);
        o.stop(t + 0.18);
      }
    });

    this.register('alarm', (ctx, master, t) => {
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        const tt = t + i * 0.22;
        o.frequency.setValueAtTime(740, tt);
        o.frequency.linearRampToValueAtTime(560, tt + 0.18);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, tt);
        g.gain.linearRampToValueAtTime(0.18, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, tt + 0.2);
        o.connect(g);
        g.connect(master);
        o.start(tt);
        o.stop(tt + 0.21);
      }
    });
  }
}
