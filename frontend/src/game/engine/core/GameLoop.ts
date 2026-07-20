// Fixed-timestep game loop. Simulation steps are decoupled from render frames and
// interpolated so movement stays smooth even when the display refresh rate varies.

export interface LoopCallbacks {
  /** Called at a fixed rate (default 60 Hz). `dt` is in seconds. */
  update: (dt: number) => void;
  /** Called once per animation frame. `alpha` ∈ [0,1] is the interpolation factor. */
  render: (alpha: number) => void;
}

export class GameLoop {
  private rafId = 0;
  private running = false;
  private last = 0;
  private accumulator = 0;
  private readonly step: number;
  private speed = 1;
  private paused = false;
  private readonly maxFrame = 0.25; // clamp huge gaps (tab switch) to avoid spiral of death

  constructor(
    private cb: LoopCallbacks,
    stepHz = 60,
  ) {
    this.step = 1 / stepHz;
  }

  setSpeed(mult: number) {
    this.speed = Math.max(0, mult);
  }

  getSpeed() {
    return this.speed;
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.last = performance.now();
  }

  isPaused() {
    return this.paused;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    let frameTime = (now - this.last) / 1000;
    this.last = now;
    if (frameTime > this.maxFrame) frameTime = this.maxFrame;

    if (!this.paused && this.speed > 0) {
      this.accumulator += frameTime * this.speed;
      let steps = 0;
      while (this.accumulator >= this.step && steps < 8) {
        this.cb.update(this.step);
        this.accumulator -= this.step;
        steps++;
      }
    }

    const alpha = this.paused ? 1 : this.accumulator / this.step;
    this.cb.render(alpha);
  };
}
