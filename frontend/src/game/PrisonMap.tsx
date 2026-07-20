import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Hammer } from 'lucide-react';
import { Building, Guard, GameInmate, GamePhase, MAP_W, MAP_H, BUILDING_META } from './types';
import { Inmate } from '../api/types';
import { BuildCatalogItem } from '../api/types';
import { inmateTarget, guardPatrol, eventMarkerPos } from './positions';
import { InmateToken } from './InmateToken';
import { GuardToken } from './GuardToken';
import { EventMarker } from './EventMarker';

interface Marker {
  key: string;
  eventId: number;
  x: number;
  y: number;
  event: any;
}

interface MapProps {
  buildings: Building[];
  guards: Guard[];
  inmates: Inmate[];
  minute: number;
  phase: GamePhase;
  events: any[];
  selectedId: number | null;
  onSelectBuilding: (b: Building | null) => void;
  /** Mode construction : type sélectionné à poser (ghost). */
  buildType: string | null;
  buildSpec: BuildCatalogItem | null;
  /** Mode déplacement : id du bâtiment en cours de déplacement. */
  moveId: number | null;
  onPlace: (cx: number, cy: number) => void;
  onMoveBuilding: (id: number, cx: number, cy: number) => void;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function PrisonMap({
  buildings,
  guards,
  inmates,
  minute,
  phase,
  events,
  selectedId,
  onSelectBuilding,
  buildType,
  buildSpec,
  moveId,
  onPlace,
  onMoveBuilding,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);

  const toLogical = useCallback((clientX: number, clientY: number) => {
    const rect = mapRef.current!.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * MAP_W;
    const y = ((clientY - rect.top) / rect.height) * MAP_H;
    return { x: clamp(x, 0, MAP_W), y: clamp(y, 0, MAP_H) };
  }, []);

  const active = useMemo(() => inmates.filter((i) => i.status === 'ACTIVE'), [inmates]);

  const inmateTargets = useMemo<GameInmate[]>(
    () =>
      active.map((im) => {
        const t = inmateTarget(im, phase, buildings);
        return { ...im, px: t.x, py: t.y };
      }),
    [active, phase, buildings],
  );

  const inmatesById = useMemo(() => {
    const m = new Map<number, Inmate>();
    for (const i of inmates) m.set(i.id, i);
    return m;
  }, [inmates]);

  const [markers, setMarkers] = useState<Marker[]>([]);
  const seen = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!events?.length) return;
    const added: Marker[] = [];
    for (const e of events) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      const p = eventMarkerPos(e, buildings, inmatesById);
      added.push({ key: `${e.id}-${e.type}`, eventId: e.id, x: p.x, y: p.y, event: e });
    }
    if (added.length) setMarkers((prev) => [...prev, ...added].slice(-12));
  }, [events, buildings, inmatesById]);

  const removeMarker = useCallback(
    (eventId: number) => setMarkers((prev) => prev.filter((m) => m.eventId !== eventId)),
    [],
  );

  // --- Glisser-déposer d'un bâtiment en mode déplacement ---
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const p = toLogical(e.clientX, e.clientY);
      setDrag((d) => (d ? { ...d, x: p.x, y: p.y } : d));
    };
    const up = (e: PointerEvent) => {
      const p = toLogical(e.clientX, e.clientY);
      onMoveBuilding(drag.id, p.x, p.y);
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag, onMoveBuilding, toLogical]);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!buildType) return;
    setGhost(toLogical(e.clientX, e.clientY));
  };

  const onBackgroundClick = (e: React.MouseEvent) => {
    if (buildType && ghost) {
      e.stopPropagation();
      onPlace(ghost.x, ghost.y);
      return;
    }
    onSelectBuilding(null);
  };

  const onBuildingPointerDown = (e: React.PointerEvent, b: Building) => {
    if (moveId !== b.id) return;
    e.stopPropagation();
    const p = toLogical(e.clientX, e.clientY);
    setDrag({ id: b.id, x: p.x, y: p.y });
  };

  const ghostMeta = buildType ? BUILDING_META[buildType as keyof typeof BUILDING_META] : null;

  return (
    <div
      className={`game-map ${buildType ? 'is-placing' : ''} ${moveId ? 'is-moving' : ''}`}
      ref={mapRef}
      onMouseMove={onMouseMove}
      onClick={onBackgroundClick}
    >
      {buildings.map((b) => {
        const meta = BUILDING_META[b.type];
        const Icon = meta.icon;
        const dim = b.state === 'DAMAGED' || b.state === 'OFFLINE';
        const selected = b.id === selectedId;
        const isDragging = drag?.id === b.id;
        const pos = isDragging ? drag! : null;
        const left = pos ? (pos.x / MAP_W) * 100 : (b.x / MAP_W) * 100;
        const top = pos ? (pos.y / MAP_H) * 100 : (b.y / MAP_H) * 100;

        const style: React.CSSProperties = {
          left: `${left}%`,
          top: `${top}%`,
          width: `${(b.w / MAP_W) * 100}%`,
          height: `${(b.h / MAP_H) * 100}%`,
          borderColor: meta.color,
          color: meta.color,
          background: `color-mix(in srgb, ${meta.color} 14%, var(--bg-elev))`,
          cursor: moveId === b.id ? 'grab' : undefined,
        };

        return (
          <motion.div
            key={b.id}
            className={`bldg cat-${b.category} ${dim ? 'is-dim' : ''} ${selected ? 'is-selected' : ''} ${
              b.state === 'UNDER_CONSTRUCTION' ? 'is-building' : ''
            }`}
            initial={isDragging ? false : { opacity: 0, scale: 0.85 }}
            animate={isDragging ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              if (buildType || moveId) {
                e.stopPropagation();
                return;
              }
              onSelectBuilding(b);
            }}
            onPointerDown={(e) => onBuildingPointerDown(e, b)}
            style={style}
          >
            {b.category === 'room' && (
              <>
                <span className="bldg-ic">
                  <Icon size={18} />
                </span>
                <span className="bldg-name">{b.name}</span>
                {b.level > 0 && <span className="bldg-lvl">L{b.level}</span>}
              </>
            )}
            {b.category === 'installation' && (
              <span className="bldg-ic inst">
                <Icon size={16} />
              </span>
            )}
            {b.state === 'UNDER_CONSTRUCTION' && (
              <span className="bldg-progress">
                <Hammer size={12} />
              </span>
            )}
          </motion.div>
        );
      })}

      {guards.map((g) => {
        const p = guardPatrol(g, buildings, minute);
        return <GuardToken key={g.id} guard={g} x={p.x} y={p.y} />;
      })}

      {inmateTargets.map((im) => (
        <InmateToken key={im.id} inmate={im} />
      ))}

      {markers.map((m) => (
        <EventMarker
          key={m.key}
          event={m.event}
          x={m.x}
          y={m.y}
          onExpire={() => removeMarker(m.eventId)}
        />
      ))}

      {buildType && ghost && ghostMeta && buildSpec && (
        <div
          className="bldg-ghost"
          style={{
            left: `${((ghost.x - buildSpec.w / 2) / MAP_W) * 100}%`,
            top: `${((ghost.y - buildSpec.h / 2) / MAP_H) * 100}%`,
            width: `${(buildSpec.w / MAP_W) * 100}%`,
            height: `${(buildSpec.h / MAP_H) * 100}%`,
            borderColor: ghostMeta.color,
            color: ghostMeta.color,
          }}
        >
          <span className="bldg-ic">
            <ghostMeta.icon size={18} />
          </span>
          <span className="bldg-name">{buildSpec.label}</span>
        </div>
      )}
    </div>
  );
}
