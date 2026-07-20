import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrisonEvent } from './entities/prison-event.entity';
import { EventQueryDto } from './dto/event-query.dto';
import { PrisonEventType, EventSeverity } from './enums';

export interface CreateEventInput {
  userId: number;
  day: number;
  type: PrisonEventType;
  title: string;
  description?: string;
  severity?: EventSeverity;
  inmateId?: number | null;
  relatedInmateId?: number | null;
}

export interface TimelinePage {
  data: PrisonEvent[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(PrisonEvent)
    private readonly eventsRepository: Repository<PrisonEvent>,
  ) {}

  async create(input: CreateEventInput): Promise<PrisonEvent> {
    const event = this.eventsRepository.create({
      userId: input.userId,
      day: input.day,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      severity: input.severity ?? EventSeverity.LOW,
      inmateId: input.inmateId ?? null,
      relatedInmateId: input.relatedInmateId ?? null,
    });
    return this.eventsRepository.save(event);
  }

  async createMany(inputs: CreateEventInput[]): Promise<PrisonEvent[]> {
    if (inputs.length === 0) return [];
    const entities = inputs.map((input) =>
      this.eventsRepository.create({
        userId: input.userId,
        day: input.day,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        severity: input.severity ?? EventSeverity.LOW,
        inmateId: input.inmateId ?? null,
        relatedInmateId: input.relatedInmateId ?? null,
      }),
    );
    return this.eventsRepository.save(entities);
  }

  async findTimeline(userId: number, query: EventQueryDto): Promise<TimelinePage> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId });

    if (query.type) {
      qb.andWhere('event.type = :type', { type: query.type });
    }
    if (query.day !== undefined) {
      qb.andWhere('event.day = :day', { day: query.day });
    }
    if (query.inmateId) {
      qb.andWhere('(event.inmateId = :inmateId OR event.relatedInmateId = :inmateId)', {
        inmateId: query.inmateId,
      });
    }

    qb.orderBy('event.day', query.sort ?? 'DESC').addOrderBy('event.id', query.sort ?? 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, page, limit, total };
  }

  async countByUser(userId: number): Promise<number> {
    return this.eventsRepository.count({ where: { userId } });
  }

  async findById(userId: number, id: number): Promise<PrisonEvent | null> {
    return this.eventsRepository.findOne({ where: { userId, id } });
  }

  /** Compte les occurrences par type et par jour (pour les graphiques). */
  async aggregateByTypeAndDay(userId: number): Promise<
    { day: number; type: PrisonEventType; count: number }[]
  > {
    const rows = await this.eventsRepository
      .createQueryBuilder('event')
      .select('event.day', 'day')
      .addSelect('event.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('event.userId = :userId', { userId })
      .groupBy('event.day')
      .addGroupBy('event.type')
      .orderBy('event.day', 'ASC')
      .getRawMany();
    return rows.map((r) => ({
      day: Number(r.day),
      type: r.type as PrisonEventType,
      count: Number(r.count),
    }));
  }
}
