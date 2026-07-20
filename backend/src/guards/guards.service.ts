import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guard, GuardStatus } from './entities/guard.entity';

interface GuardSeed {
  name: string;
  x: number;
  y: number;
  assignedBlock: string;
  skill: number;
}

const GUARD_SEEDS: GuardSeed[] = [
  { name: 'Garde Marchand', x: 215, y: 250, assignedBlock: 'A1', skill: 58 },
  { name: 'Garde Lefevre', x: 415, y: 250, assignedBlock: 'B2', skill: 64 },
  { name: 'Garde Nguyen', x: 615, y: 250, assignedBlock: 'C1', skill: 52 },
  { name: 'Garde Bonnet', x: 865, y: 380, assignedBlock: 'SEC', skill: 71 },
];

@Injectable()
export class GuardsService {
  constructor(
    @InjectRepository(Guard)
    private readonly repo: Repository<Guard>,
  ) {}

  async ensureSeed(userId: number): Promise<void> {
    const count = await this.repo.count({ where: { userId } });
    if (count > 0) return;
    const toCreate = GUARD_SEEDS.map((g) =>
      this.repo.create({
        ...g,
        userId,
        salary: 80,
        status: GuardStatus.ON_DUTY,
      }),
    );
    await this.repo.save(toCreate);
  }

  async findAll(userId: number): Promise<Guard[]> {
    await this.ensureSeed(userId);
    return this.repo.find({ where: { userId }, order: { id: 'ASC' } });
  }

  async findOne(userId: number, id: number): Promise<Guard> {
    const g = await this.repo.findOne({ where: { id, userId } });
    if (!g) throw new NotFoundException('Gardien introuvable');
    return g;
  }

  /** Met à jour la position (ronde / intervention). */
  async updatePosition(userId: number, id: number, x: number, y: number): Promise<Guard> {
    const g = await this.findOne(userId, id);
    g.x = x;
    g.y = y;
    return this.repo.save(g);
  }
}
