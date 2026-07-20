// Typed event bus used to decouple systems (AI, interactions, audio, UI).

import type { Entity } from '../world/types';

export type GameEventMap = {
  // lifecycle
  'engine:started': void;
  'engine:stopped': void;
  'engine:speed': number;

  // entities
  'entity:spawned': Entity;
  'entity:removed': Entity;
  'entity:selected': Entity | null;

  // social / simulation
  'relation:changed': { a: number; b: number; type: string; strength: number };
  'gang:formed': { name: string; members: number[] };
  'gang:war': { a: string; b: string };

  // interactions
  'interaction': {
    kind: string;
    a: Entity;
    b?: Entity;
    x: number;
    y: number;
    text?: string;
  };
  'fight': { a: Entity; b: Entity; x: number; y: number };
  'escape': { inmate: Entity };
  'arrested': { inmate: Entity; by?: Entity };
  'death': { entity: Entity };

  // world / effects
  'alarm': { x: number; y: number; reason: string };
  'fire': { x: number; y: number };
  'explosion': { x: number; y: number };
  'weather': { kind: 'rain' | 'fog' | 'clear' };
  'building:state': { id: number; state: string };

  // log
  'log': { level: 'info' | 'warn' | 'critical'; text: string; icon?: string };

  // UI requests
  'ui:focusEntity': Entity;
  'ui:radial': { entity: Entity; x: number; y: number };
};

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<keyof GameEventMap, Set<Handler<any>>>();

  on<K extends keyof GameEventMap>(type: K, fn: Handler<GameEventMap[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(fn);
    return () => set!.delete(fn);
  }

  off<K extends keyof GameEventMap>(type: K, fn: Handler<GameEventMap[K]>): void {
    this.handlers.get(type)?.delete(fn);
  }

  emit<K extends keyof GameEventMap>(type: K, payload: GameEventMap[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch (err) {
        // A faulty listener must never break the game loop.
        console.error(`[EventBus] listener for "${String(type)}" threw`, err);
      }
    }
  }

  clear() {
    this.handlers.clear();
  }
}
