// Generic object pool to avoid per-frame allocations for transient objects
// (particles, speech bubbles, projectiles, etc.).

export class ObjectPool<T> {
  private free: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, prealloc = 0) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < prealloc; i++) this.free.push(factory());
  }

  acquire(): T {
    const obj = this.free.pop();
    return obj ?? this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.free.push(obj);
  }

  get available(): number {
    return this.free.length;
  }
}
