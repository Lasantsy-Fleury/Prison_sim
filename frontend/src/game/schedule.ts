import { useEffect, useRef, useState } from 'react';
import { GamePhase } from './types';

export type GameSpeed = 'pause' | 'slow' | 'normal' | 'fast';

const MINUTES_PER_DAY = 1440;

/** Borne une phase à la journée (4 tranches de 6h). */
export function phaseFromMinute(m: number): GamePhase {
  if (m < 360) return 'NUIT';
  if (m < 720) return 'MATIN';
  if (m < 1080) return 'JOUR';
  return 'SOIR';
}

export function hourLabel(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const mm = Math.floor(m % 60);
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Incrément de minutes simulées par seconde réelle, selon la vitesse. */
const DELTA_PER_SEC: Record<GameSpeed, number> = {
  pause: 0,
  slow: 4,
  normal: 12,
  fast: 30,
};

/**
 * Horloge de jeu : avance le temps (minute simulée) en continu.
 * `- 'pause' gèle ; 'fast' avance vite et déclenche onDayWrap à chaque
 *    nouveau jour (pour l'avancement automatique de la simulation).
 */
export function useGameClock(speed: GameSpeed, onDayWrap?: () => void) {
  const [minute, setMinute] = useState(0);
  const wrapRef = useRef(onDayWrap);
  wrapRef.current = onDayWrap;

  useEffect(() => {
    const delta = DELTA_PER_SEC[speed];
    if (delta === 0) return;
    const id = setInterval(() => {
      setMinute((prev) => {
        const next = prev + delta;
        if (next >= MINUTES_PER_DAY) {
          wrapRef.current?.();
          return next - MINUTES_PER_DAY;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [speed]);

  return {
    minute,
    phase: phaseFromMinute(minute),
    hourLabel: hourLabel(minute),
    fraction: minute / MINUTES_PER_DAY,
  };
}
