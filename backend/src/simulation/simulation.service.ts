import { Injectable } from '@nestjs/common';
import { SimulationEngine } from './engine/simulation.engine';
import { InmatesService } from '../inmates/inmates.service';
import { EventsService } from '../events/events.service';
import { PrisonService } from '../prison/prison.service';
import { EconomyService } from '../economy/economy.service';
import { BuildingsService } from '../buildings/buildings.service';
import { PrisonState } from '../prison/entities/prison-state.entity';
import { RelationType } from '../inmates/entities/inmate-relation.entity';
import { PrisonEventType } from '../events/enums';

export interface AdvanceResult {
  day: number;
  state: PrisonState;
  events: any[];
  summary: string[];
  dayStats: Partial<Record<PrisonEventType, number>>;
  generatedCount: number;
}

@Injectable()
export class SimulationService {
  constructor(
    private readonly engine: SimulationEngine,
    private readonly inmatesService: InmatesService,
    private readonly eventsService: EventsService,
    private readonly prisonService: PrisonService,
    private readonly economyService: EconomyService,
    private readonly buildingsService: BuildingsService,
  ) {}

  async advanceDays(userId: number, days = 1): Promise<AdvanceResult> {
    let result: AdvanceResult | null = null;
    let combinedEvents: any[] = [];
    let combinedSummary: string[] = [];
    const combinedDayStats: Partial<Record<PrisonEventType, number>> = {};
    let totalGenerated = 0;

    for (let d = 0; d < days; d++) {
      const dayResult = await this.runSingleDay(userId);
      result = dayResult;
      combinedEvents = combinedEvents.concat(dayResult.events);
      combinedSummary = combinedSummary.concat(dayResult.summary);
      totalGenerated += dayResult.generatedCount;
      (Object.keys(dayResult.dayStats) as PrisonEventType[]).forEach((k) => {
        combinedDayStats[k] = (combinedDayStats[k] ?? 0) + (dayResult.dayStats[k] ?? 0);
      });
    }

    return {
      day: result!.day,
      state: result!.state,
      events: combinedEvents.slice(0, 50),
      summary: combinedSummary.slice(0, 30),
      dayStats: combinedDayStats,
      generatedCount: totalGenerated,
    };
  }

  private async runSingleDay(userId: number): Promise<AdvanceResult> {
    const state = await this.prisonService.getOrCreate(userId);
    const newDay = state.currentDay + 1;

    const inmates = await this.inmatesService.findActive(userId);
    const relations = await this.inmatesService.loadRelationsMap(userId);

    const engineResult = this.engine.runDay({
      userId,
      day: newDay,
      securityLevel: state.securityLevel,
      budget: state.budget,
      inmates,
      relations,
    });

    // Persistance des changements de détenus
    await this.inmatesService.saveMany(engineResult.changedInmates);

    // Persistance des relations
    for (const u of engineResult.relationUpserts) {
      await this.inmatesService.upsertRelation(
        userId,
        u.aId,
        u.bId,
        u.type as RelationType,
        u.delta,
      );
    }

    // Persistance des événements
    await this.eventsService.createMany(engineResult.events);

    // Mise à jour de l'état global de la prison
    const updated = await this.prisonService.update(userId, {
      currentDay: newDay,
      securityLevel: Math.max(0, Math.min(100, state.securityLevel + engineResult.securityLevelDelta)),
      budget: Math.max(0, state.budget + engineResult.budgetDelta),
    });

    // Complétion des constructions en cours puis règlement financier du jour
    await this.buildingsService.completeConstructions(userId);
    await this.economyService.settleDay(userId, newDay);

    return {
      day: newDay,
      state: updated,
      events: engineResult.events.slice(0, 50),
      summary: engineResult.summaryLines,
      dayStats: engineResult.dayStats,
      generatedCount: engineResult.events.length,
    };
  }
}
