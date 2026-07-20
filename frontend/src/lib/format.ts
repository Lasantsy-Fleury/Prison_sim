import { PrisonEventType, EventSeverity } from '../api/types';

export const EVENT_LABELS: Record<PrisonEventType, string> = {
  ESCAPE_ATTEMPT: 'Tentative d’évasion',
  ESCAPE_SUCCESS: 'Évasion réussie',
  FIGHT: 'Bagarre',
  ALLIANCE: 'Alliance',
  CONFLICT: 'Conflit',
  CORRUPTION: 'Corruption',
  BEHAVIOR_CHANGE: 'Changement comportement',
  DECISION: 'Décision',
  ARRIVAL: 'Arrivée',
  TRANSFER: 'Transfert',
  RELEASE: 'Libération',
  SECURITY_CHANGE: 'Sécurité',
  FIRE: 'Incendie',
  MEDICAL: 'Soin médical',
  SEARCH: 'Fouille',
  INFO: 'Info',
};

export function severityClass(sev: EventSeverity): string {
  return `badge-${sev}`;
}

/** Couleur d'une barre d'attribut selon sa valeur (0-100). */
export function attrColor(value: number, kind?: 'fear' | 'morale' | 'aggr' | 'intel'): string {
  if (kind === 'fear') {
    // crainte élevée = bonne (docile)
    return value > 60 ? 'var(--success)' : value > 35 ? 'var(--warn)' : 'var(--danger)';
  }
  if (kind === 'morale') {
    return value > 60 ? 'var(--success)' : value > 35 ? 'var(--warn)' : 'var(--danger)';
  }
  if (kind === 'aggr') {
    return value > 60 ? 'var(--danger)' : value > 35 ? 'var(--warn)' : 'var(--success)';
  }
  return 'var(--accent-2)';
}

export function scoreColor(score: number): string {
  if (score >= 70) return 'var(--success)';
  if (score >= 45) return 'var(--warn)';
  return 'var(--danger)';
}

export function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
