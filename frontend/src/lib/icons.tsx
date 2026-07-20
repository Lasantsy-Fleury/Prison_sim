import {
  Footprints,
  Wind,
  Swords,
  HeartHandshake,
  Flame,
  Banknote,
  Drama,
  ClipboardList,
  DoorOpen,
  ArrowRightLeft,
  Unlock,
  ShieldAlert,
  Info,
  HeartPulse,
  Search,
  Siren,
  User,
  UserPlus,
  Flag,
  LucideIcon,
} from 'lucide-react';
import { PrisonEventType } from '../api/types';

export const EVENT_ICONS: Record<PrisonEventType, LucideIcon> = {
  ESCAPE_ATTEMPT: Footprints,
  ESCAPE_SUCCESS: Wind,
  FIGHT: Swords,
  ALLIANCE: HeartHandshake,
  CONFLICT: Flame,
  CORRUPTION: Banknote,
  BEHAVIOR_CHANGE: Drama,
  DECISION: ClipboardList,
  ARRIVAL: DoorOpen,
  TRANSFER: ArrowRightLeft,
  RELEASE: Unlock,
  SECURITY_CHANGE: ShieldAlert,
  FIRE: Flame,
  MEDICAL: HeartPulse,
  SEARCH: Search,
  INFO: Info,
};

/** Maps an engine log `icon` key (string) to a lucide glyph. */
export const LOG_ICONS: Record<string, LucideIcon> = {
  gang: Flag,
  war: Flame,
  inmate: User,
  new: UserPlus,
  search: Search,
  police: Siren,
  fight: Swords,
};

/** Renders the lucide glyph for an engine log entry, or a neutral dot. */
export function LogIcon({ name }: { name?: string }) {
  const Icon = name ? LOG_ICONS[name] : undefined;
  if (!Icon) return <span className="hud-log-icon dot">•</span>;
  return (
    <span className="hud-log-icon">
      <Icon size={13} />
    </span>
  );
}

/** Classe de la tuile colorée associée à la sévérité d'un événement. */
export function severityTile(sev: string): string {
  return `event-icon t-${sev}`;
}
