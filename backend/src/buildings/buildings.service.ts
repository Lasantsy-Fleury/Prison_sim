import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Building,
  BuildingType,
  BuildingCategory,
  BuildingState,
} from './entities/building.entity';
import { PrisonService } from '../prison/prison.service';
import {
  BUILD_CATALOG,
  MAP_W,
  MAP_H,
  buildSpecFor,
} from './catalog';
import { CreateBuildingDto } from './dto/create-building.dto';

interface SeedSpec {
  type: BuildingType;
  category: BuildingCategory;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  capacity: number;
}

/** Plan par défaut d'une prison (grille logique 1000x640). */
const SEED_LAYOUT: SeedSpec[] = [
  // --- Blocs cellules (colonne gauche) ---
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc A1', x: 40, y: 40, w: 150, h: 120, capacity: 12 },
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc A2', x: 40, y: 180, w: 150, h: 120, capacity: 12 },
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc A3', x: 40, y: 320, w: 150, h: 120, capacity: 12 },
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc B1', x: 240, y: 40, w: 150, h: 120, capacity: 12 },
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc B2', x: 240, y: 180, w: 150, h: 120, capacity: 12 },
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc B3', x: 240, y: 320, w: 150, h: 120, capacity: 12 },
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc C1', x: 440, y: 40, w: 150, h: 120, capacity: 12 },
  { type: BuildingType.CELL_BLOCK, category: BuildingCategory.ROOM, name: 'Bloc C2', x: 440, y: 180, w: 150, h: 120, capacity: 12 },

  // --- Couloirs ---
  { type: BuildingType.CORRIDOR, category: BuildingCategory.ROOM, name: 'Couloir A–B', x: 195, y: 40, w: 40, h: 400, capacity: 0 },
  { type: BuildingType.CORRIDOR, category: BuildingCategory.ROOM, name: 'Couloir B–C', x: 395, y: 40, w: 40, h: 260, capacity: 0 },
  { type: BuildingType.CORRIDOR, category: BuildingCategory.ROOM, name: 'Couloir central', x: 40, y: 452, w: 550, h: 28, capacity: 0 },

  // --- Bâtiments de service (rangée basse) ---
  { type: BuildingType.CANTEEN, category: BuildingCategory.ROOM, name: 'Cantine', x: 40, y: 500, w: 180, h: 110, capacity: 150 },
  { type: BuildingType.WORKSHOP, category: BuildingCategory.ROOM, name: 'Ateliers', x: 240, y: 500, w: 180, h: 110, capacity: 120 },
  { type: BuildingType.YARD, category: BuildingCategory.ROOM, name: 'Cour de promenade', x: 440, y: 500, w: 300, h: 110, capacity: 250 },

  // --- Bâtiments (colonne droite) ---
  { type: BuildingType.INFIRMARY, category: BuildingCategory.ROOM, name: 'Infirmerie', x: 770, y: 40, w: 190, h: 120, capacity: 20 },
  { type: BuildingType.VISITING, category: BuildingCategory.ROOM, name: 'Parloir', x: 770, y: 180, w: 190, h: 120, capacity: 16 },
  { type: BuildingType.SECURITY, category: BuildingCategory.ROOM, name: 'Salle de sécurité', x: 770, y: 320, w: 190, h: 120, capacity: 8 },

  // --- Installations de sécurité (aperçu V2) ---
  { type: BuildingType.DOOR, category: BuildingCategory.INSTALLATION, name: 'Portail', x: 470, y: 608, w: 44, h: 22, capacity: 0 },
  { type: BuildingType.GUARD_POST, category: BuildingCategory.INSTALLATION, name: 'Poste de garde', x: 700, y: 320, w: 44, h: 44, capacity: 2 },
  { type: BuildingType.CAMERA, category: BuildingCategory.INSTALLATION, name: 'Caméra', x: 18, y: 18, w: 30, h: 30, capacity: 0 },
  { type: BuildingType.CAMERA, category: BuildingCategory.INSTALLATION, name: 'Caméra', x: 952, y: 18, w: 30, h: 30, capacity: 0 },
  { type: BuildingType.CAMERA, category: BuildingCategory.INSTALLATION, name: 'Caméra', x: 18, y: 592, w: 30, h: 30, capacity: 0 },
  { type: BuildingType.FENCE, category: BuildingCategory.INSTALLATION, name: 'Clôture', x: 0, y: 0, w: 1000, h: 16, capacity: 0 },
  { type: BuildingType.FENCE, category: BuildingCategory.INSTALLATION, name: 'Clôture', x: 0, y: 0, w: 16, h: 640, capacity: 0 },
  { type: BuildingType.BARBED_WIRE, category: BuildingCategory.INSTALLATION, name: 'Fil barbelé', x: 0, y: 620, w: 1000, h: 14, capacity: 0 },
];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly repo: Repository<Building>,
    private readonly prisonService: PrisonService,
  ) {}

  async ensureSeed(userId: number): Promise<void> {
    const count = await this.repo.count({ where: { userId } });
    if (count > 0) return;
    const toCreate = SEED_LAYOUT.map((s) =>
      this.repo.create({ ...s, userId, level: 0, state: BuildingState.OPERATIONAL }),
    );
    await this.repo.save(toCreate);
  }

  async findAll(userId: number): Promise<Building[]> {
    await this.ensureSeed(userId);
    return this.repo.find({ where: { userId }, order: { id: 'ASC' } });
  }

  async findOne(userId: number, id: number): Promise<Building> {
    const b = await this.repo.findOne({ where: { id, userId } });
    if (!b) throw new NotFoundException('Bâtiment introuvable');
    return b;
  }

  async updatePosition(userId: number, id: number, x: number, y: number): Promise<Building> {
    const b = await this.findOne(userId, id);
    b.x = clamp(x, 0, MAP_W - b.w);
    b.y = clamp(y, 0, MAP_H - b.h);
    return this.repo.save(b);
  }

  async setState(userId: number, id: number, state: BuildingState): Promise<Building> {
    const b = await this.findOne(userId, id);
    b.state = state;
    return this.repo.save(b);
  }

  /** Amélioration (V2) : incrémente le niveau. */
  async upgrade(userId: number, id: number): Promise<Building> {
    const b = await this.findOne(userId, id);
    b.level += 1;
    if (b.capacity > 0) b.capacity = Math.round(b.capacity * 1.15);
    return this.repo.save(b);
  }

  /** Construit un nouveau bâtiment : déduit le coût et le pose en construction. */
  async create(userId: number, dto: CreateBuildingDto): Promise<Building> {
    const spec = buildSpecFor(dto.type);
    if (!spec) throw new BadRequestException('Type de bâtiment inconnu.');

    const state = await this.prisonService.getOrCreate(userId);
    if (state.budget < spec.buildCost) {
      throw new BadRequestException(
        `Budget insuffisant pour cette construction (${spec.buildCost} € requis).`,
      );
    }

    await this.prisonService.adjustBudget(userId, -spec.buildCost);

    const w = dto.w ?? spec.w;
    const h = dto.h ?? spec.h;
    const name =
      dto.name?.trim() ||
      `${spec.label} ${await this.countByType(userId, dto.type) + 1}`;

    const building = this.repo.create({
      userId,
      type: spec.type,
      category: spec.category,
      name,
      x: clamp(dto.x, 0, MAP_W - w),
      y: clamp(dto.y, 0, MAP_H - h),
      w,
      h,
      capacity: dto.capacity ?? spec.capacity,
      level: 0,
      state: BuildingState.UNDER_CONSTRUCTION,
    });
    return this.repo.save(building);
  }

  /** Agrandit un bâtiment : taille + capacité accrues, coût déduit. */
  async expand(userId: number, id: number): Promise<Building> {
    const b = await this.findOne(userId, id);
    const cost = Math.round(40 + b.capacity * 1.5 + b.level * 25);

    const state = await this.prisonService.getOrCreate(userId);
    if (state.budget < cost) {
      throw new BadRequestException(`Budget insuffisant pour agrandir (${cost} € requis).`);
    }
    await this.prisonService.adjustBudget(userId, -cost);

    b.w = Math.min(MAP_W - b.x, b.w + 30);
    b.h = Math.min(MAP_H - b.y, b.h + 24);
    if (b.capacity > 0) {
      b.capacity = b.capacity + Math.max(4, Math.round(b.capacity * 0.2));
    }
    b.level += 1;
    return this.repo.save(b);
  }

  /** Achève les constructions en cours (appelé à l'avancement d'un jour). */
  async completeConstructions(userId: number): Promise<number> {
    const pending = await this.repo.find({
      where: { userId, state: BuildingState.UNDER_CONSTRUCTION },
    });
    if (pending.length === 0) return 0;
    for (const b of pending) b.state = BuildingState.OPERATIONAL;
    await this.repo.save(pending);
    return pending.length;
  }

  /** Catalogue public des bâtiments constructibles (coûts + tailles). */
  getCatalog() {
    return BUILD_CATALOG;
  }

  private async countByType(userId: number, type: BuildingType): Promise<number> {
    return this.repo.count({ where: { userId, type } });
  }
}
