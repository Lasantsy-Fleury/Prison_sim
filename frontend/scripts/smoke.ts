// Headless smoke test: runs the simulation systems without the DOM to catch
// runtime errors (infinite loops, undefined access) in the core engine.
import { World } from '../src/game/engine/world/World';
import { AStar } from '../src/game/engine/world/AStar';
import { EventBus } from '../src/game/engine/core/EventBus';
import { Rng } from '../src/game/engine/core/Rng';
import { Effects } from '../src/game/engine/renderer/Effects';
import { SoundManager } from '../src/game/engine/audio/SoundManager';
import { SimulationHarness } from '../src/game/engine/world/SimulationHarness';
import { createEntity } from '../src/game/engine/world/Entity';
import type { BuildingLike } from '../src/game/engine/world/types';

const buildings: BuildingLike[] = [
  { id: 1, type: 'CELL_BLOCK', name: 'Bloc A', x: 60, y: 80, w: 200, h: 150, category: 'room', state: 'OPERATIONAL', capacity: 20, level: 1 },
  { id: 3, type: 'CANTEEN', name: 'Cantine', x: 360, y: 80, w: 180, h: 120, category: 'room', state: 'OPERATIONAL', capacity: 40, level: 1 },
  { id: 4, type: 'YARD', name: 'Cour', x: 360, y: 320, w: 220, h: 230, category: 'room', state: 'OPERATIONAL', capacity: 80, level: 1 },
  { id: 5, type: 'WORKSHOP', name: 'Atelier', x: 640, y: 80, w: 180, h: 150, category: 'room', state: 'OPERATIONAL', capacity: 30, level: 1 },
  { id: 6, type: 'INFIRMARY', name: 'Infirmerie', x: 640, y: 360, w: 150, h: 120, category: 'room', state: 'OPERATIONAL', capacity: 15, level: 1 },
];

const world = new World(123, 1000, 640);
world.setBuildings(buildings);
const astar = new AStar(world.grid);
const bus = new EventBus();
const rng = new Rng(42);
const effects = new Effects();
const audio = new SoundManager();
const harness = new SimulationHarness();

const cells = world.byType('CELL_BLOCK')[0];
for (let i = 0; i < 40; i++) {
  const e = createEntity({ kind: i % 5 === 0 ? 'guard' : 'inmate', seed: 1000 + i, x: cells.x + 20, y: cells.y + 20 });
  world.add(e);
}

let errors = 0;
const t0 = Date.now();
const STEPS = 60 * 60; // ~60s of sim
for (let s = 0; s < STEPS; s++) {
  world.advance(1 / 60);
  world.rebuildSpatial();
  harness.step({ world, bus, rng, grid: world.grid, astar, effects, audio, dt: 1 / 60, time: world.time.simTime });
  if (s % 600 === 0) {
    const moving = [...world.entities.values()].filter((e) => e.path.length > 0).length;
    console.log(`t=${(world.time.simTime).toFixed(0)}s day=${world.time.day} hr=${world.time.hour.toFixed(1)} moving=${moving} gangs=${world.gangs.size} fights=${world.list('inmate').filter((e) => e.state === 'fight').length}`);
  }
}
const dt = Date.now() - t0;
console.log(`OK: ran ${STEPS} steps in ${dt}ms (${(dt / STEPS).toFixed(3)}ms/step), entities=${world.entities.size}, log=${world.log.length}, gangs=${world.gangs.size}`);
void errors;
