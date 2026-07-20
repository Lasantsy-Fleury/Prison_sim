import { Injectable } from '@nestjs/common';
import { InmatesService } from '../inmates/inmates.service';
import { EventsService } from '../events/events.service';
import { PrisonService } from '../prison/prison.service';
import { InmateStatus } from '../inmates/entities/inmate.entity';
import { PrisonEventType } from '../events/enums';

@Injectable()
export class StatsService {
  constructor(
    private readonly inmatesService: InmatesService,
    private readonly eventsService: EventsService,
    private readonly prisonService: PrisonService,
  ) {}

  async getDashboard(userId: number) {
    const state = await this.prisonService.getOrCreate(userId);
    const inmates = await this.inmatesService.findActive(userId);
    const allInmates = await this.inmatesService.findAll(userId, 'ALL');
    const escaped = allInmates.filter((i) => i.status === InmateStatus.ESCAPED).length;
    const released = allInmates.filter((i) => i.status === InmateStatus.RELEASED).length;
    const recent = await this.eventsService.findTimeline(userId, {
      page: 1,
      limit: 8,
      sort: 'DESC',
    });

    const averages = this.averageAttributes(inmates);
    const threat = this.threatLevel(averages, state.securityLevel, inmates.length);

    return {
      day: state.currentDay,
      prisonName: state.name,
      securityLevel: state.securityLevel,
      budget: state.budget,
      population: inmates.length,
      totalInmates: allInmates.length,
      escaped,
      released,
      averages,
      threat,
      recentEvents: recent.data,
      activeInmates: inmates.slice(0, 6),
    };
  }

  async getStats(userId: number) {
    const state = await this.prisonService.getOrCreate(userId);
    const inmates = await this.inmatesService.findActive(userId);
    const allInmates = await this.inmatesService.findAll(userId, 'ALL');
    const averages = this.averageAttributes(inmates);

    const escaped = allInmates.filter((i) => i.status === InmateStatus.ESCAPED).length;
    const released = allInmates.filter((i) => i.status === InmateStatus.RELEASED).length;
    const transferred = allInmates.filter((i) => i.status === InmateStatus.TRANSFERRED).length;

    const behaviorBuckets = this.bucketBehavior(inmates);
    const dangerous = [...inmates]
      .sort((a, b) => a.behaviorScore - b.behaviorScore)
      .slice(0, 5)
      .map((i) => ({ id: i.id, name: i.name, behaviorScore: i.behaviorScore, block: i.block }));

    const series = await this.eventsService.aggregateByTypeAndDay(userId);
    const eventTypeCounts = this.countByType(series);

    return {
      day: state.currentDay,
      population: inmates.length,
      totalInmates: allInmates.length,
      escaped,
      released,
      transferred,
      averages,
      behaviorBuckets,
      dangerousInmates: dangerous,
      eventSeries: series,
      eventTypeCounts,
    };
  }

  private averageAttributes(inmates: { intelligence: number; fear: number; aggressiveness: number; morale: number; behaviorScore: number }[]) {
    if (inmates.length === 0) {
      return { intelligence: 0, fear: 0, aggressiveness: 0, morale: 0, behaviorScore: 0, count: 0 };
    }
    const sum = inmates.reduce(
      (acc, i) => ({
        intelligence: acc.intelligence + i.intelligence,
        fear: acc.fear + i.fear,
        aggressiveness: acc.aggressiveness + i.aggressiveness,
        morale: acc.morale + i.morale,
        behaviorScore: acc.behaviorScore + i.behaviorScore,
      }),
      { intelligence: 0, fear: 0, aggressiveness: 0, morale: 0, behaviorScore: 0 },
    );
    const n = inmates.length;
    return {
      count: n,
      intelligence: Math.round(sum.intelligence / n),
      fear: Math.round(sum.fear / n),
      aggressiveness: Math.round(sum.aggressiveness / n),
      morale: Math.round(sum.morale / n),
      behaviorScore: Math.round(sum.behaviorScore / n),
    };
  }

  private threatLevel(
    averages: { aggressiveness: number; fear: number; behaviorScore: number },
    securityLevel: number,
    population: number,
  ): number {
    const base = 100 - averages.behaviorScore;
    const securityFactor = Math.max(0, 60 - securityLevel) * 0.5;
    const raw = base * 0.7 + securityFactor + (population === 0 ? 0 : 5);
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  private bucketBehavior(inmates: { behaviorScore: number }[]) {
    const buckets = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];
    inmates.forEach((i) => {
      const b = buckets.find((bk) => i.behaviorScore >= bk.min && i.behaviorScore <= bk.max);
      if (b) b.count++;
    });
    return buckets;
  }

  private countByType(series: { type: PrisonEventType; count: number }[]) {
    const counts: Partial<Record<PrisonEventType, number>> = {};
    series.forEach((s) => {
      counts[s.type] = (counts[s.type] ?? 0) + s.count;
    });
    return counts;
  }
}
