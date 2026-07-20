import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inmate, InmateStatus } from './entities/inmate.entity';
import {
  InmateRelation,
  RelationType,
} from './entities/inmate-relation.entity';
import { CreateInmateDto, SeedInmatesDto } from './dto/inmate.dto';
import { EventsService } from '../events/events.service';
import {
  PrisonEventType,
  EventSeverity,
} from '../events/enums';

const FIRST_NAMES = [
  'Antoine', 'Karim', 'Sofiane', 'Lucas', 'Mehdi', 'Hugo', 'Yanis', 'Nathan',
  'Thomas', 'Adam', 'Léo', 'Enzo', 'Rayan', 'Maxime', 'Julien', 'Bastien',
  'Moussa', 'Kévin', 'Florian', 'Sami', 'Djibril', 'Nordine', 'Axel', 'Théo',
];
const LAST_NAMES = [
  'Moreau', 'Bernard', 'Petit', 'Durand', 'Lefebvre', 'Garnier', 'Da Silva',
  'Nguyen', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lopez',
  'Faure', 'Benali', 'Mansour', 'Diallo', 'Traoré', 'Kone', 'Cherif', 'Hamon',
  'Lemoine',
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.min(min, max) + Math.random() * (Math.abs(max - min) + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

@Injectable()
export class InmatesService {
  constructor(
    @InjectRepository(Inmate)
    private readonly inmatesRepository: Repository<Inmate>,
    @InjectRepository(InmateRelation)
    private readonly relationsRepository: Repository<InmateRelation>,
    private readonly eventsService: EventsService,
  ) {}

  /** Score de comportement 0-100 (plus haut = plus sûr/calme). */
  computeBehaviorScore(inmate: Partial<Inmate>): number {
    const aggressiveness = inmate.aggressiveness ?? 50;
    const fear = inmate.fear ?? 50;
    const morale = inmate.morale ?? 50;
    const intelligence = inmate.intelligence ?? 50;

    let score = 100;
    score -= aggressiveness * 0.35;
    score -= (100 - fear) * 0.25;
    score -= (100 - morale) * 0.25;
    if (aggressiveness > 60 && intelligence > 60) {
      score -= 10; // détenu manipulateur et dangereux
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async create(userId: number, dto: CreateInmateDto, day = 0): Promise<Inmate> {
    const inmate = this.inmatesRepository.create({
      userId,
      name: dto.name,
      age: dto.age ?? randInt(19, 68),
      intelligence: dto.intelligence ?? randInt(20, 95),
      fear: dto.fear ?? randInt(20, 90),
      aggressiveness: dto.aggressiveness ?? randInt(15, 95),
      morale: dto.morale ?? randInt(25, 90),
      block: dto.block ?? `${pick(['A', 'B', 'C', 'D'])}${randInt(1, 4)}`,
      status: InmateStatus.ACTIVE,
    });
    inmate.behaviorScore = this.computeBehaviorScore(inmate);
    const saved = await this.inmatesRepository.save(inmate);

    await this.eventsService.create({
      userId,
      day,
      type: PrisonEventType.ARRIVAL,
      title: `${saved.name} a rejoint la prison`,
      description: `Nouveau détenu assigné au bloc ${saved.block}.`,
      severity: EventSeverity.LOW,
      inmateId: saved.id,
    });

    return saved;
  }

  async seed(userId: number, dto: SeedInmatesDto, day = 0): Promise<Inmate[]> {
    const created: Inmate[] = [];
    for (let i = 0; i < dto.count; i++) {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES).toUpperCase()}`;
      created.push(
        await this.create(
          userId,
          { name, block: dto.block },
          day,
        ),
      );
    }
    return created;
  }

  async findAll(userId: number, status?: string): Promise<Inmate[]> {
    const where: any = { userId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    return this.inmatesRepository.find({
      where,
      order: { behaviorScore: 'ASC' },
    });
  }

  async findActive(userId: number): Promise<Inmate[]> {
    return this.inmatesRepository.find({
      where: { userId, status: InmateStatus.ACTIVE },
      order: { behaviorScore: 'ASC' },
    });
  }

  async findOne(userId: number, id: number): Promise<Inmate> {
    const inmate = await this.inmatesRepository.findOne({ where: { userId, id } });
    if (!inmate) {
      throw new NotFoundException('Détenu introuvable');
    }
    return inmate;
  }

  async getById(userId: number, id: number): Promise<Inmate | null> {
    return this.inmatesRepository.findOne({ where: { userId, id } });
  }

  async countActive(userId: number): Promise<number> {
    return this.inmatesRepository.count({
      where: { userId, status: InmateStatus.ACTIVE },
    });
  }

  async remove(userId: number, id: number): Promise<{ deleted: boolean }> {
    const inmate = await this.findOne(userId, id);
    await this.relationsRepository.delete({
      userId,
      inmateAId: id,
    });
    await this.relationsRepository.delete({
      userId,
      inmateBId: id,
    });
    await this.inmatesRepository.remove(inmate);

    await this.eventsService.create({
      userId,
      day: 0,
      type: PrisonEventType.RELEASE,
      title: `${inmate.name} a quitté la prison`,
      description: 'Détenu supprimé du registre par le directeur.',
      severity: EventSeverity.LOW,
      inmateId: id,
    });

    return { deleted: true };
  }

  async changeStatus(
    userId: number,
    id: number,
    status: InmateStatus,
  ): Promise<Inmate> {
    const inmate = await this.findOne(userId, id);
    inmate.status = status;
    return this.inmatesRepository.save(inmate);
  }

  /** Ajuste des attributs et recalcule le score de comportement. */
  async adjustAttributes(
    userId: number,
    id: number,
    deltas: Partial<Record<'intelligence' | 'fear' | 'aggressiveness' | 'morale', number>>,
  ): Promise<Inmate> {
    const inmate = await this.findOne(userId, id);
    (['intelligence', 'fear', 'aggressiveness', 'morale'] as const).forEach((key) => {
      if (deltas[key] !== undefined) {
        inmate[key] = Math.max(0, Math.min(100, inmate[key] + deltas[key]!));
      }
    });
    inmate.behaviorScore = this.computeBehaviorScore(inmate);
    return this.inmatesRepository.save(inmate);
  }

  async move(userId: number, id: number, block: string): Promise<Inmate> {
    const inmate = await this.findOne(userId, id);
    inmate.block = block;
    return this.inmatesRepository.save(inmate);
  }

  async getRelations(
    userId: number,
    inmateId: number,
  ): Promise<(InmateRelation & { targetName?: string })[]> {
    const relations = await this.relationsRepository.find({
      where: { userId, inmateAId: inmateId },
    });
    const targetIds = relations.map((r) => r.inmateBId);
    const nameMap = new Map<number, string>();
    if (targetIds.length > 0) {
      const targets = await this.inmatesRepository
        .createQueryBuilder('i')
        .where('i.userId = :userId', { userId })
        .andWhere('i.id IN (:...ids)', { ids: targetIds })
        .getMany();
      targets.forEach((t) => nameMap.set(t.id, t.name));
    }

    return relations.map((r) => ({ ...r, targetName: nameMap.get(r.inmateBId) }));
  }

  /** Crée ou met à jour une relation dirigée (utilisé par le moteur). */
  async upsertRelation(
    userId: number,
    aId: number,
    bId: number,
    type: RelationType,
    strengthDelta: number,
  ): Promise<void> {
    if (aId === bId) return;
    let relation = await this.relationsRepository.findOne({
      where: { userId, inmateAId: aId, inmateBId: bId },
    });
    if (!relation) {
      relation = this.relationsRepository.create({
        userId,
        inmateAId: aId,
        inmateBId: bId,
        type: RelationType.NEUTRAL,
        strength: 0,
      });
    }
    relation.strength = Math.max(-100, Math.min(100, relation.strength + strengthDelta));
    relation.type =
      relation.strength > 20
        ? RelationType.ALLY
        : relation.strength < -20
          ? RelationType.ENEMY
          : RelationType.NEUTRAL;
    await this.relationsRepository.save(relation);
  }

  /** Sauvegarde en masse (utilisé par le moteur de simulation). */
  async saveMany(inmates: Inmate[]): Promise<Inmate[]> {
    if (inmates.length === 0) return [];
    return this.inmatesRepository.save(inmates);
  }

  /** Charge toutes les relations d'un directeur sous forme de Map "aId:bId". */
  async loadRelationsMap(userId: number): Promise<Map<string, InmateRelation>> {
    const all = await this.relationsRepository.find({ where: { userId } });
    const map = new Map<string, InmateRelation>();
    all.forEach((r) => map.set(`${r.inmateAId}:${r.inmateBId}`, r));
    return map;
  }

  async saveRelations(relations: InmateRelation[]): Promise<void> {
    if (relations.length === 0) return;
    await this.relationsRepository.save(relations);
  }
}
