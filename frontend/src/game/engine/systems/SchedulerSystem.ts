// Timetable resolution. Sets each agent's current activity from its schedule and
// the in-world clock (see spec §5). The AI system turns the activity into motion.

import type { SimContext } from '../core/SimContext';
import type { Entity, ScheduleActivity, ScheduleEntry } from '../world/types';
import { INMATE_SCHEDULE, GUARD_SCHEDULE } from '../data/presets';

export class SchedulerSystem {
  private scheduleFor(kind: Entity['kind']): ScheduleEntry[] {
    return kind === 'guard' ? GUARD_SCHEDULE : INMATE_SCHEDULE;
  }

  currentActivity(e: Entity, hour: number): ScheduleActivity {
    const s = this.scheduleFor(e.kind);
    let act: ScheduleActivity = s[0].activity as ScheduleActivity;
    for (const entry of s) {
      if (hour >= entry.hour) act = entry.activity as ScheduleActivity;
    }
    // before the first slot, keep the previous night's sleep/cell
    if (hour < s[0].hour) act = (s[s.length - 1].activity as ScheduleActivity);
    return act;
  }

  update(ctx: SimContext) {
    const hour = ctx.world.time.hour;
    for (const e of ctx.world.entities.values()) {
      const act = this.currentActivity(e, hour);
      // Don't override a locked activity state (eat/sleep/fight…) while it lasts.
      const locked = e.state === 'eat' || e.state === 'sleep' || e.state === 'fight' || e.state === 'injured' || e.state === 'arrested' || e.state === 'shower' || e.state === 'escort';
      if (!locked) e.action = act;
    }
  }
}
