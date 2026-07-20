import { Building, Guard, GamePhase, MAP_W, MAP_H } from './types';
import { PrisonEvent, Inmate } from '../api/types';

function center(b: Building) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/** Bâtiment du type donné (premier trouvé). */
export function buildingByType(buildings: Building[], type: Building['type']): Building | undefined {
  return buildings.find((b) => b.type === type);
}

/** Centre de la cellule du bloc (ex: 'A1' -> "Bloc A1"). */
export function blockCell(buildings: Building[], block?: string): Building | undefined {
  if (!block) return undefined;
  return buildings.find(
    (b) => b.type === 'CELL_BLOCK' && b.name === `Bloc ${block}`,
  );
}

/** Jitter déterministe dans le rectangle (pour éparpiller les jetons). */
function jitter(id: number, w: number, h: number, pad = 14) {
  const a = (id * 9301 + 49297) % 233280;
  const b = (id * 49297 + 9301) % 233280;
  const fx = a / 233280;
  const fy = b / 233280;
  return {
    dx: pad + fx * Math.max(0, w - pad * 2),
    dy: pad + fy * Math.max(0, h - pad * 2),
  };
}

/** Cible d'un détenu selon la phase de la journée. */
export function inmateTarget(
  inmate: Inmate,
  phase: GamePhase,
  buildings: Building[],
): { x: number; y: number } {
  const fallback = { x: MAP_W / 2, y: MAP_H / 2 };
  if (buildings.length === 0) return fallback;

  let target: Building | undefined;
  switch (phase) {
    case 'NUIT':
    case 'MATIN':
      target = blockCell(buildings, inmate.block);
      break;
    case 'JOUR':
      target = inmate.id % 2 === 0
        ? buildingByType(buildings, 'YARD')
        : buildingByType(buildings, 'WORKSHOP');
      if (!target) target = blockCell(buildings, inmate.block);
      break;
    case 'SOIR':
    default:
      target = buildingByType(buildings, 'CANTEEN') ?? blockCell(buildings, inmate.block);
      break;
  }
  if (!target) return fallback;
  const { dx, dy } = jitter(inmate.id, target.w, target.h);
  return { x: target.x + dx, y: target.y + dy };
}

const PATROL_TYPES: Building['type'][] = [
  'CELL_BLOCK',
  'SECURITY',
  'DOOR',
  'CORRIDOR',
];

/** Position d'un gardien en ronde (boucle continue selon l'horloge). */
export function guardPatrol(
  guard: Guard,
  buildings: Building[],
  minute: number,
): { x: number; y: number } {
  const waypoints: { x: number; y: number }[] = [];
  // point de départ : son bloc assigné
  const home = blockCell(buildings, guard.assignedBlock);
  if (home) waypoints.push(center(home));
  for (const t of PATROL_TYPES) {
    const b = buildingByType(buildings, t);
    if (b) waypoints.push(center(b));
  }
  if (waypoints.length < 2) {
    return { x: guard.x || MAP_W / 2, y: guard.y || MAP_H / 2 };
  }

  const PERIOD = 360; // 6h de ronde
  const t = (minute % PERIOD) / PERIOD; // 0..1
  const seg = t * waypoints.length;
  const i = Math.floor(seg) % waypoints.length;
  const j = (i + 1) % waypoints.length;
  const f = seg - Math.floor(seg);
  const a = waypoints[i];
  const b = waypoints[j];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** Position d'un marqueur d'événement sur la carte. */
export function eventMarkerPos(
  event: PrisonEvent,
  buildings: Building[],
  inmatesById: Map<number, Inmate>,
): { x: number; y: number } {
  const fallback = { x: MAP_W / 2, y: MAP_H / 2 };
  if (buildings.length === 0) return fallback;

  const atBuilding = (type: Building['type']) => {
    const b = buildingByType(buildings, type);
    return b ? center(b) : fallback;
  };
  const atInmate = (id?: number | null) => {
    if (!id) return undefined;
    const im = inmatesById.get(id);
    const cell = blockCell(buildings, im?.block);
    return cell ? center(cell) : undefined;
  };

  switch (event.type) {
    case 'ESCAPE_ATTEMPT':
    case 'ESCAPE_SUCCESS':
    case 'ARRIVAL':
    case 'RELEASE':
      return atBuilding('DOOR');
    case 'CORRUPTION':
    case 'SECURITY_CHANGE':
      return atBuilding('SECURITY');
    case 'FIGHT': {
      const a = atInmate(event.inmateId);
      const b = atInmate(event.relatedInmateId);
      if (a && b) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      return a ?? fallback;
    }
    case 'CONFLICT':
    case 'ALLIANCE':
    case 'BEHAVIOR_CHANGE':
    case 'DECISION':
    case 'TRANSFER':
      return atInmate(event.inmateId) ?? fallback;
    case 'FIRE':
      return atInmate(event.inmateId) ?? atBuilding('CELL_BLOCK');
    case 'MEDICAL':
      return atBuilding('INFIRMARY');
    case 'SEARCH':
      return atInmate(event.inmateId) ?? atBuilding('CELL_BLOCK');
    default:
      return fallback;
  }
}
