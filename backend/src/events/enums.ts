export enum PrisonEventType {
  ESCAPE_ATTEMPT = 'ESCAPE_ATTEMPT',
  ESCAPE_SUCCESS = 'ESCAPE_SUCCESS',
  FIGHT = 'FIGHT',
  ALLIANCE = 'ALLIANCE',
  CONFLICT = 'CONFLICT',
  CORRUPTION = 'CORRUPTION',
  BEHAVIOR_CHANGE = 'BEHAVIOR_CHANGE',
  DECISION = 'DECISION',
  ARRIVAL = 'ARRIVAL',
  TRANSFER = 'TRANSFER',
  RELEASE = 'RELEASE',
  SECURITY_CHANGE = 'SECURITY_CHANGE',
  FIRE = 'FIRE',
  MEDICAL = 'MEDICAL',
  SEARCH = 'SEARCH',
  INFO = 'INFO',
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const EVENT_TYPE_LABELS: Record<PrisonEventType, string> = {
  ESCAPE_ATTEMPT: 'Tentative d’évasion',
  ESCAPE_SUCCESS: 'Évasion réussie',
  FIGHT: 'Bagarre',
  ALLIANCE: 'Alliance',
  CONFLICT: 'Conflit',
  CORRUPTION: 'Corruption du personnel',
  BEHAVIOR_CHANGE: 'Changement de comportement',
  DECISION: 'Décision du directeur',
  ARRIVAL: 'Arrivée de détenu',
  TRANSFER: 'Transfert',
  RELEASE: 'Libération',
  SECURITY_CHANGE: 'Changement de sécurité',
  FIRE: 'Incendie',
  MEDICAL: 'Soin médical',
  SEARCH: 'Fouille',
  INFO: 'Information',
};
