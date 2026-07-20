import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InmatesService } from '../inmates/inmates.service';
import { PrisonService } from '../prison/prison.service';
import { EventsService } from '../events/events.service';
import { InmateStatus } from '../inmates/entities/inmate.entity';
import { PrisonEventType, EventSeverity } from '../events/enums';
import { DecisionDto, DecisionType } from './dto/decision.dto';

export interface DecisionResult {
  ok: boolean;
  message: string;
  data?: any;
  event?: any;
}

@Injectable()
export class DecisionsService {
  constructor(
    private readonly inmatesService: InmatesService,
    private readonly prisonService: PrisonService,
    private readonly eventsService: EventsService,
  ) {}

  async apply(userId: number, dto: DecisionDto): Promise<DecisionResult> {
    const state = await this.prisonService.getOrCreate(userId);

    switch (dto.type) {
      case DecisionType.INCREASE_SECURITY:
        return this.increaseSecurity(userId, dto.amount ?? 10, state);
      case DecisionType.MOVE_INMATE:
        return this.moveInmate(userId, dto);
      case DecisionType.SANCTION:
        return this.sanction(userId, dto);
      case DecisionType.REWARD:
        return this.reward(userId, dto);
      case DecisionType.RELEASE:
        return this.release(userId, dto);
      default:
        throw new BadRequestException('Type de décision inconnu');
    }
  }

  private async increaseSecurity(
    userId: number,
    amount: number,
    state: { currentDay: number; budget: number },
  ): Promise<DecisionResult> {
    const cost = amount * 5;
    if (state.budget < cost) {
      throw new BadRequestException(
        `Budget insuffisant : il faut ${cost} (disponible ${state.budget})`,
      );
    }
    const updatedState = await this.prisonService.update(userId, {
      securityLevel: Math.min(100, (await this.prisonService.getOrCreate(userId)).securityLevel + amount),
    });
    await this.prisonService.adjustBudget(userId, -cost);
    const finalState = await this.prisonService.getOrCreate(userId);

    const event = await this.eventsService.create({
      userId,
      day: updatedState.currentDay,
      type: PrisonEventType.SECURITY_CHANGE,
      title: `Sécurité renforcée (+${amount})`,
      description: `Le directeur a augmenté le niveau de sécurité pour ${cost} €. Niveau actuel : ${finalState.securityLevel}.`,
      severity: EventSeverity.MEDIUM,
      inmateId: null,
    });

    return {
      ok: true,
      message: `Sécurité augmentée de ${amount} (coût ${cost})`,
      data: finalState,
      event,
    };
  }

  private async moveInmate(userId: number, dto: DecisionDto): Promise<DecisionResult> {
    if (!dto.inmateId || !dto.block) {
      throw new BadRequestException('inmateId et block sont requis pour MOVE_INMATE');
    }
    const inmate = await this.inmatesService.findOne(userId, dto.inmateId);
    const oldBlock = inmate.block;
    const updated = await this.inmatesService.adjustAttributes(userId, inmate.id, {
      morale: 2,
      aggressiveness: -2,
    });
    updated.block = dto.block;
    await this.inmatesService.move(userId, updated.id, dto.block);

    const event = await this.eventsService.create({
      userId,
      day: (await this.prisonService.getOrCreate(userId)).currentDay,
      type: PrisonEventType.TRANSFER,
      title: `${inmate.name} déplacé vers le bloc ${dto.block}`,
      description: `Transfert du bloc ${oldBlock} vers ${dto.block}.`,
      severity: EventSeverity.LOW,
      inmateId: inmate.id,
    });

    return {
      ok: true,
      message: `${inmate.name} déplacé vers ${dto.block}`,
      data: updated,
      event,
    };
  }

  private async sanction(userId: number, dto: DecisionDto): Promise<DecisionResult> {
    if (!dto.inmateId) {
      throw new BadRequestException('inmateId requis pour SANCTION');
    }
    const inmate = await this.inmatesService.findOne(userId, dto.inmateId);
    const updated = await this.inmatesService.adjustAttributes(userId, inmate.id, {
      morale: -12,
      fear: 10,
      aggressiveness: -4,
    });

    const event = await this.eventsService.create({
      userId,
      day: (await this.prisonService.getOrCreate(userId)).currentDay,
      type: PrisonEventType.DECISION,
      title: `Sanction disciplinaire : ${inmate.name}`,
      description: `Le directeur a sanctionné le détenu. Moral en baisse, crainte en hausse.`,
      severity: EventSeverity.MEDIUM,
      inmateId: inmate.id,
    });

    return {
      ok: true,
      message: `${inmate.name} a été sanctionné`,
      data: updated,
      event,
    };
  }

  private async reward(userId: number, dto: DecisionDto): Promise<DecisionResult> {
    if (!dto.inmateId) {
      throw new BadRequestException('inmateId requis pour REWARD');
    }
    const inmate = await this.inmatesService.findOne(userId, dto.inmateId);
    const updated = await this.inmatesService.adjustAttributes(userId, inmate.id, {
      morale: 12,
      fear: -6,
      aggressiveness: 2,
    });

    const event = await this.eventsService.create({
      userId,
      day: (await this.prisonService.getOrCreate(userId)).currentDay,
      type: PrisonEventType.DECISION,
      title: `Récompense : ${inmate.name}`,
      description: `Le directeur a récompensé le détenu. Moral en hausse.`,
      severity: EventSeverity.LOW,
      inmateId: inmate.id,
    });

    return {
      ok: true,
      message: `${inmate.name} a été récompensé`,
      data: updated,
      event,
    };
  }

  private async release(userId: number, dto: DecisionDto): Promise<DecisionResult> {
    if (!dto.inmateId) {
      throw new BadRequestException('inmateId requis pour RELEASE');
    }
    const inmate = await this.inmatesService.findOne(userId, dto.inmateId);
    const updated = await this.inmatesService.changeStatus(
      userId,
      inmate.id,
      InmateStatus.RELEASED,
    );

    const event = await this.eventsService.create({
      userId,
      day: (await this.prisonService.getOrCreate(userId)).currentDay,
      type: PrisonEventType.RELEASE,
      title: `${inmate.name} libéré`,
      description: `Le directeur a ordonné la libération du détenu.`,
      severity: EventSeverity.LOW,
      inmateId: inmate.id,
    });

    return {
      ok: true,
      message: `${inmate.name} a été libéré`,
      data: updated,
      event,
    };
  }
}
