// Selection state. The engine keeps a single selected entity; the HUD and camera
// read from here. Independent of React so it can be queried inside the loop.

import type { Entity } from '../world/types';
import type { World } from '../world/World';

export class SelectionManager {
  selectedId: number | null = null;

  constructor(private world: World) {}

  select(e: Entity | null) {
    this.selectedId = e ? e.id : null;
    this.world.selectedId = this.selectedId;
  }

  get(): Entity | null {
    return this.selectedId != null ? this.world.get(this.selectedId) ?? null : null;
  }

  clear() {
    this.selectedId = null;
    this.world.selectedId = null;
  }
}
