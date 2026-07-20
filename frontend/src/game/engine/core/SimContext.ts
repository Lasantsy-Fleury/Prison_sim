// Shared context passed to every system each simulation tick. Keeps systems
// decoupled from the GameEngine internals.

import type { World } from '../world/World';
import type { EventBus } from './EventBus';
import type { Rng } from './Rng';
import type { Grid } from '../world/Grid';
import type { AStar } from '../world/AStar';
import type { Effects } from '../renderer/Effects';
import type { SoundManager } from '../audio/SoundManager';
import type { Camera } from '../camera/Camera';

export interface SimContext {
  world: World;
  bus: EventBus;
  rng: Rng;
  grid: Grid;
  astar: AStar;
  effects: Effects;
  audio: SoundManager;
  camera: Camera;
  dt: number;
  /** Continuous simulation time (seconds). */
  time: number;
}

export interface System {
  update(ctx: SimContext): void;
}
