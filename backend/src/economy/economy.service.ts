import { Injectable } from '@nestjs/common';
import { PrisonService } from '../prison/prison.service';
import { GuardsService } from '../guards/guards.service';
import { BuildingsService } from '../buildings/buildings.service';
import { InmatesService } from '../inmates/inmates.service';
import { EventsService } from '../events/events.service';
import { PrisonEventType, EventSeverity } from '../events/enums';
import { MAINTENANCE_COST } from '../buildings/catalog';

export interface FinanceLine {
  label: string;
  amount: number;
}

export interface EconomyBreakdown {
  revenue: FinanceLine[];
  expenses: FinanceLine[];
  totalRevenue: number;
  totalExpenses: number;
  net: number;
}

/** Subvention de base de l'État (€/jour). */
const STATE_SUBVENTION = 180;
/** Allocation par détenu incarcéré (€/jour). */
const PER_INMATE_ALLOWANCE = 14;
/** Production d'un atelier opérationnel par niveau (€/jour). */
const WORKSHOP_INCOME_PER_LEVEL = 25;

@Injectable()
export class EconomyService {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly guardsService: GuardsService,
    private readonly buildingsService: BuildingsService,
    private readonly inmatesService: InmatesService,
    private readonly eventsService: EventsService,
  ) {}

  /** Calcule le bilan financier projeté du jour (sans muter le budget). */
  async getBreakdown(userId: number): Promise<EconomyBreakdown> {
    const [guards, buildings, inmates] = await Promise.all([
      this.guardsService.findAll(userId),
      this.buildingsService.findAll(userId),
      this.inmatesService.findActive(userId),
    ]);

    const revenue: FinanceLine[] = [];
    const expenses: FinanceLine[] = [];

    // --- Revenus ---
    revenue.push({ label: 'Subvention de l’État', amount: STATE_SUBVENTION });
    revenue.push({
      label: `Allocations (${inmates.length} détenus)`,
      amount: inmates.length * PER_INMATE_ALLOWANCE,
    });
    const workshopIncome = buildings
      .filter((b) => b.type === 'WORKSHOP' && b.state === 'OPERATIONAL')
      .reduce((sum, b) => sum + (1 + b.level) * WORKSHOP_INCOME_PER_LEVEL, 0);
    if (workshopIncome > 0) {
      revenue.push({ label: 'Production des ateliers', amount: workshopIncome });
    }

    // --- Dépenses ---
    const salaries = guards.reduce((sum, g) => sum + g.salary, 0);
    expenses.push({ label: `Salaires (${guards.length} gardiens)`, amount: salaries });

    const maintenance = buildings
      .filter((b) => b.state === 'OPERATIONAL' || b.state === 'UNDER_CONSTRUCTION')
      .reduce((sum, b) => sum + (MAINTENANCE_COST[b.type] ?? 2), 0);
    expenses.push({ label: 'Maintenance des bâtiments', amount: maintenance });

    const totalRevenue = revenue.reduce((s, l) => s + l.amount, 0);
    const totalExpenses = expenses.reduce((s, l) => s + l.amount, 0);
    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      net: totalRevenue - totalExpenses,
    };
  }

  /**
   * Soldé du jour : ajuste le budget de la prison de (revenus - dépenses)
   * et émet un événement d'alerte en cas de déficit.
   */
  async settleDay(userId: number, day: number): Promise<{ net: number; totalRevenue: number; totalExpenses: number }> {
    const bd = await this.getBreakdown(userId);
    if (bd.net !== 0) {
      await this.prisonService.adjustBudget(userId, bd.net);
    }
    if (bd.net < 0) {
      await this.eventsService.create({
        userId,
        day,
        type: PrisonEventType.INFO,
        title: `Déficit financier — Jour ${day}`,
        description: `Revenus ${bd.totalRevenue} € · Dépenses ${bd.totalExpenses} € · Solde ${bd.net} €. Réduisez les coûts ou agrandissez les ateliers.`,
        severity: EventSeverity.MEDIUM,
      });
    }
    return {
      net: bd.net,
      totalRevenue: bd.totalRevenue,
      totalExpenses: bd.totalExpenses,
    };
  }
}
