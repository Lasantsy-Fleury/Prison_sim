import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrisonState } from './entities/prison-state.entity';

@Injectable()
export class PrisonService {
  constructor(
    @InjectRepository(PrisonState)
    private readonly stateRepository: Repository<PrisonState>,
  ) {}

  async getOrCreate(userId: number): Promise<PrisonState> {
    let state = await this.stateRepository.findOne({ where: { userId } });
    if (!state) {
      state = this.stateRepository.create({ userId });
      state = await this.stateRepository.save(state);
    }
    return state;
  }

  async update(
    userId: number,
    partial: Partial<Pick<PrisonState, 'name' | 'securityLevel' | 'budget' | 'currentDay'>>,
  ): Promise<PrisonState> {
    const state = await this.getOrCreate(userId);
    Object.assign(state, partial);
    return this.stateRepository.save(state);
  }

  async incrementDay(userId: number): Promise<PrisonState> {
    const state = await this.getOrCreate(userId);
    state.currentDay = state.currentDay + 1;
    return this.stateRepository.save(state);
  }

  async adjustBudget(userId: number, delta: number): Promise<PrisonState> {
    const state = await this.getOrCreate(userId);
    state.budget = Math.max(0, state.budget + delta);
    return this.stateRepository.save(state);
  }

  async setSecurityLevel(userId: number, level: number): Promise<PrisonState> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return this.update(userId, { securityLevel: clamped });
  }
}
