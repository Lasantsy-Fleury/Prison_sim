import { Injectable } from '@nestjs/common';
import { Inmate } from '../../inmates/entities/inmate.entity';
import { InmateRelation, RelationType } from '../../inmates/entities/inmate-relation.entity';
import { PrisonEventType, EventSeverity } from '../../events/enums';
import { RunDayParams, DayResult, RelationUpsert } from './types';
import { CreateEventInput } from '../../events/events.service';

function randInt(min: number, max: number): number {
  return Math.floor(Math.min(min, max) + Math.random() * (Math.abs(max - min) + 1));
}
function rand(): number {
  return Math.random();
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function chance(p: number): boolean {
  return rand() < p;
}

/**
 * Moteur de simulation : fait "vivre" la prison une journée.
 * Combine règles, probabilités et scores de comportement pour faire
 * évoluer les détenus de façon autonome et variée.
 */
@Injectable()
export class SimulationEngine {
  runDay(params: RunDayParams): DayResult {
    const { userId, day, securityLevel, budget, inmates } = params;
    const events: CreateEventInput[] = [];
    const changedInmates: Inmate[] = [];
    const relationUpserts: RelationUpsert[] = [];
    const dayStats: Partial<Record<PrisonEventType, number>> = {};
    const summaryLines: string[] = [];

    const touched = new Set<number>();
    const markTouched = (i: Inmate) => {
      if (!touched.has(i.id)) {
        touched.add(i.id);
        changedInmates.push(i);
      }
    };

    const pushEvent = (
      type: PrisonEventType,
      title: string,
      description: string,
      severity: EventSeverity,
      inmateId: number | null,
      relatedInmateId: number | null = null,
    ) => {
      events.push({
        userId,
        day,
        type,
        title,
        description,
        severity,
        inmateId,
        relatedInmateId,
      });
      dayStats[type] = (dayStats[type] ?? 0) + 1;
    };

    if (inmates.length === 0) {
      return {
        day,
        events,
        changedInmates,
        relationUpserts,
        securityLevelDelta: 0,
        budgetDelta: 0,
        dayStats,
        summaryLines: ['Aucun détenu incarcéré : la prison reste silencieuse.'],
      };
    }

    // --- 1. Traitement individuel de chaque détenu ---
    for (const inmate of inmates) {
      // Dérive naturelle du comportement (tendances + bruit)
      const moraleDrift = Math.round((50 - inmate.morale) * 0.05) + randInt(-5, 5);
      const fearDrift = Math.round((40 - inmate.fear) * 0.03) + randInt(-4, 4);
      const aggrDrift = randInt(-2, 2);
      inmate.morale = clamp(inmate.morale + moraleDrift, 0, 100);
      inmate.fear = clamp(inmate.fear + fearDrift, 0, 100);
      inmate.aggressiveness = clamp(inmate.aggressiveness + aggrDrift, 0, 100);

      // Probabilité de tentative d'évasion
      const pEscape = clamp(
        0.02 +
          ((100 - inmate.fear) / 100) * 0.12 +
          (inmate.aggressiveness / 100) * 0.1 +
          (inmate.intelligence / 100) * 0.08 -
          (securityLevel / 100) * 0.2,
        0.005,
        0.45,
      );

      if (chance(pEscape)) {
        const captureChance = 0.4 + (securityLevel / 100) * 0.5;
        if (chance(captureChance)) {
          inmate.fear = clamp(inmate.fear + 12, 0, 100);
          inmate.morale = clamp(inmate.morale - 8, 0, 100);
          pushEvent(
            PrisonEventType.ESCAPE_ATTEMPT,
            `${inmate.name} a tenté de s'évader`,
            `Repris par les gardes avant de franchir la clôture. Cote de sécurité déterminante.`,
            EventSeverity.MEDIUM,
            inmate.id,
          );
          summaryLines.push(`${inmate.name} a échoué dans sa tentative d'évasion.`);
        } else {
          inmate.status = 'ESCAPED' as any;
          pushEvent(
            PrisonEventType.ESCAPE_SUCCESS,
            `${inmate.name} s'est évadé !`,
            `Le détenu a disparu. Sécurité insuffisante ou complicité externe.`,
            EventSeverity.CRITICAL,
            inmate.id,
          );
          summaryLines.push(`⚠️ ${inmate.name} a réussi à s'évader.`);
        }
      }

      // Changement de comportement notable (bruit faible pour limiter le spam)
      if (chance(0.06)) {
        const mood =
          inmate.morale > 60 ? 'se montre coopératif' :
          inmate.morale < 35 ? 'a le moral dans les chaussettes' :
          inmate.aggressiveness > 65 ? 'est de plus en plus agressif' :
          'observe une attitude neutre';
        pushEvent(
          PrisonEventType.BEHAVIOR_CHANGE,
          `${inmate.name} ${mood}`,
          `Évolution spontanée du comportement au bloc ${inmate.block}.`,
          EventSeverity.LOW,
          inmate.id,
        );
      }

      markTouched(inmate);
    }

    // --- 2. Interactions par paires (bagarres, alliances, conflits) ---
    const n = inmates.length;
    const considered = new Set<string>();
    const pairCount = n <= 12 ? (n * (n - 1)) / 2 : n * 4;
    let attempts = 0;
    let pairsProcessed = 0;

    while (pairsProcessed < pairCount && attempts < pairCount * 6) {
      attempts++;
      const a = inmates[randInt(0, n - 1)];
      const b = inmates[randInt(0, n - 1)];
      if (a.id === b.id) continue;
      const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
      if (considered.has(key)) continue;
      considered.add(key);
      pairsProcessed++;

      const relA = params.relations.get(`${a.id}:${b.id}`);
      const relB = params.relations.get(`${b.id}:${a.id}`);
      const rel = relA && relB
        ? (Math.abs(relA.strength) >= Math.abs(relB.strength) ? relA : relB)
        : relA ?? relB ?? null;
      const isEnemy = rel?.type === RelationType.ENEMY;
      const isAlly = rel?.type === RelationType.ALLY;

      const similarity =
        1 -
        (Math.abs(a.intelligence - b.intelligence) +
          Math.abs(a.morale - b.morale)) /
          200;

      // Bagarre
      let pFight = clamp(
        0.01 +
          ((a.aggressiveness + b.aggressiveness) / 200) * 0.2 -
          ((a.fear + b.fear) / 200) * 0.1 -
          (securityLevel / 100) * 0.1,
        0.002,
        0.3,
      );
      if (isEnemy) pFight += 0.12;
      if (isAlly) pFight = Math.max(0, pFight - 0.08);

      if (chance(pFight)) {
        const loser = chance(0.5) ? a : b;
        const winner = loser === a ? b : a;
        winner.morale = clamp(winner.morale + 4, 0, 100);
        loser.morale = clamp(loser.morale - 10, 0, 100);
        loser.fear = clamp(loser.fear + 6, 0, 100);
        a.aggressiveness = clamp(a.aggressiveness + 2, 0, 100);
        b.aggressiveness = clamp(b.aggressiveness + 2, 0, 100);
        pushEvent(
          PrisonEventType.FIGHT,
          `Bagarre entre ${a.name} et ${b.name}`,
          `${loser.name} a eu le dessous. Tension au bloc ${a.block}.`,
          EventSeverity.HIGH,
          a.id,
          b.id,
        );
        relationUpserts.push({ aId: a.id, bId: b.id, type: RelationType.ENEMY, delta: 15 });
        summaryLines.push(`🥊 Bagarre signalée : ${a.name} vs ${b.name}.`);
        markTouched(a);
        markTouched(b);
      } else if (!isEnemy && chance(0.01 + similarity * 0.05)) {
        // Alliance
        a.morale = clamp(a.morale + 3, 0, 100);
        b.morale = clamp(b.morale + 3, 0, 100);
        pushEvent(
          PrisonEventType.ALLIANCE,
          `Alliance entre ${a.name} et ${b.name}`,
          `Les deux détenus se sont rapprochés. Confiance mutuelle en hausse.`,
          EventSeverity.LOW,
          a.id,
          b.id,
        );
        relationUpserts.push({ aId: a.id, bId: b.id, type: RelationType.ALLY, delta: 12 });
        markTouched(a);
        markTouched(b);
      } else if (chance(isEnemy ? 0.18 : 0.02)) {
        // Conflit (verbal / tension)
        const target = chance(0.5) ? a : b;
        target.morale = clamp(target.morale - 5, 0, 100);
        pushEvent(
          PrisonEventType.CONFLICT,
          `Conflit entre ${a.name} et ${b.name}`,
          `Montée de tension et disputes récurrentes.`,
          EventSeverity.MEDIUM,
          a.id,
          b.id,
        );
        relationUpserts.push({ aId: a.id, bId: b.id, type: RelationType.ENEMY, delta: 8 });
        markTouched(target);
      }
    }

    // --- 3. Corruption du personnel (globale) ---
    let securityLevelDelta = 0;
    const pCorruption = clamp(
      0.03 + ((100 - securityLevel) / 100) * 0.1 - (budget / 2000) * 0.02,
      0.005,
      0.2,
    );
    if (chance(pCorruption)) {
      const corruptee = inmates[randInt(0, n - 1)];
      corruptee.fear = clamp(corruptee.fear - 10, 0, 100);
      corruptee.morale = clamp(corruptee.morale + 8, 0, 100);
      securityLevelDelta -= 2;
      pushEvent(
        PrisonEventType.CORRUPTION,
        `Corruption : ${corruptee.name} a soudoyé un garde`,
        `Un membre du personnel a fermé les yeux. L'efficacité de la sécurité chute.`,
        EventSeverity.HIGH,
        corruptee.id,
      );
      summaryLines.push(`💰 Corruption détectée impliquant ${corruptee.name}.`);
      markTouched(corruptee);
    }

    // --- 3b. Événements de service (incendie / soin / fouille) ---
    const pFire = clamp(0.008 + (100 - securityLevel) / 100 * 0.01, 0.002, 0.05);
    if (chance(pFire)) {
      const victim = inmates[randInt(0, n - 1)];
      victim.fear = clamp(victim.fear + 8, 0, 100);
      victim.morale = clamp(victim.morale - 12, 0, 100);
      pushEvent(
        PrisonEventType.FIRE,
        `Incendie au bloc ${victim.block}`,
        `Départ de feu signalé. Intervention des gardes et évacuation en cours.`,
        EventSeverity.CRITICAL,
        victim.id,
      );
      summaryLines.push(`🔥 Incendie déclaré au bloc ${victim.block}.`);
      markTouched(victim);
    }

    const pMedical = clamp(0.02 + (100 - inmates.reduce((s, i) => s + i.morale, 0) / Math.max(1, n) / 100) * 0.05, 0.005, 0.12);
    if (chance(pMedical)) {
      const patient = inmates[randInt(0, n - 1)];
      patient.morale = clamp(patient.morale + 6, 0, 100);
      pushEvent(
        PrisonEventType.MEDICAL,
        `Soin médical pour ${patient.name}`,
        `Transfert à l'infirmerie pour prise en charge.`,
        EventSeverity.LOW,
        patient.id,
      );
      markTouched(patient);
    }

    const pSearch = clamp(0.03 - (securityLevel / 100) * 0.015, 0.005, 0.06);
    if (chance(pSearch)) {
      const target = inmates[randInt(0, n - 1)];
      target.fear = clamp(target.fear + 4, 0, 100);
      pushEvent(
        PrisonEventType.SEARCH,
        `Fouille de cellule menée`,
        `Contrôle de routine au bloc ${target.block}. Tension au sein de la population.`,
        EventSeverity.MEDIUM,
        target.id,
      );
      markTouched(target);
    }

    // --- 4. Recalcule le score de comportement des détenus touchés ---
    for (const inmate of changedInmates) {
      inmate.behaviorScore = this.scoreFor(inmate);
    }

    return {
      day,
      events,
      changedInmates,
      relationUpserts,
      securityLevelDelta,
      budgetDelta: 0, // le règlement financier est géré par EconomyService
      dayStats,
      summaryLines,
    };
  }

  /** Score de comportement 0-100 (plus haut = plus sûr). Partagé avec InmatesService. */
  private scoreFor(inmate: Inmate): number {
    let score = 100;
    score -= inmate.aggressiveness * 0.35;
    score -= (100 - inmate.fear) * 0.25;
    score -= (100 - inmate.morale) * 0.25;
    if (inmate.aggressiveness > 60 && inmate.intelligence > 60) score -= 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
