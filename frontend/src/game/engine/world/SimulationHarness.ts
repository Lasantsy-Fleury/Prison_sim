// SimulationHarness: owns the ordered list of simulation systems and advances
// them one fixed step. Kept separate from GameEngine so the simulation can run
// headless (tests) or be swapped/reordered without touching the renderer.

import type { SimContext } from '../core/SimContext';
import { NeedsSystem } from '../systems/NeedsSystem';
import { SchedulerSystem } from '../systems/SchedulerSystem';
import { AISystem } from '../systems/AISystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { SocialSystem } from '../systems/SocialSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { MovementSystem } from '../systems/MovementSystem';
import { AnimationManager } from '../animations/AnimationManager';

export class SimulationHarness {
  private scheduler = new SchedulerSystem();
  private ai = new AISystem();
  private movement = new MovementSystem();
  private needs = new NeedsSystem();
  private interaction = new InteractionSystem();
  private social = new SocialSystem();
  private inventory = new InventorySystem();
  private anim = new AnimationManager();

  step(ctx: SimContext) {
    this.scheduler.update(ctx);
    this.ai.update(ctx);
    this.movement.update(ctx);
    this.needs.update(ctx);
    this.interaction.update(ctx);
    this.social.update(ctx);
    this.inventory.update(ctx);
    this.anim.update(ctx.world, ctx.dt);
    ctx.effects.update(ctx.dt, ctx.world, ctx.camera);
  }
}
