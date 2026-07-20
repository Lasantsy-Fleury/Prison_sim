import { Inmate } from '../../inmates/entities/inmate.entity';
import { InmateRelation, RelationType } from '../../inmates/entities/inmate-relation.entity';
import { CreateEventInput } from '../../events/events.service';
import { PrisonEventType } from '../../events/enums';

export interface RelationUpsert {
  aId: number;
  bId: number;
  type: RelationType;
  delta: number;
}

export interface DayResult {
  day: number;
  events: CreateEventInput[];
  changedInmates: Inmate[];
  relationUpserts: RelationUpsert[];
  securityLevelDelta: number;
  budgetDelta: number;
  dayStats: Partial<Record<PrisonEventType, number>>;
  summaryLines: string[];
}

export interface RunDayParams {
  userId: number;
  day: number;
  securityLevel: number;
  budget: number;
  inmates: Inmate[];
  relations: Map<string, InmateRelation>;
}
