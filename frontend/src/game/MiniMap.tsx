import { useMemo } from 'react';
import { Building, Guard, GamePhase, MAP_W, MAP_H, BUILDING_META } from './types';
import { Inmate } from '../api/types';
import { inmateTarget } from './positions';

interface MiniMapProps {
  buildings: Building[];
  guards: Guard[];
  inmates: Inmate[];
  events: any[];
  phase: GamePhase;
  selectedId: number | null;
  onSelect: (b: Building | null) => void;
}

export function MiniMap({
  buildings,
  guards,
  inmates,
  events,
  phase,
  selectedId,
  onSelect,
}: MiniMapProps) {
  const active = useMemo(() => inmates.filter((i) => i.status === 'ACTIVE'), [inmates]);
  const inmateDots = useMemo(
    () =>
      active.map((im) => {
        const t = inmateTarget(im, phase, buildings);
        return { id: im.id, x: t.x, y: t.y };
      }),
    [active, phase, buildings],
  );

  const recentEvents = (events ?? []).slice(0, 6);
  const latestEvent = recentEvents[0];

  return (
    <div className="minimap" aria-label="Mini-carte de la prison">
      <div className="minimap-title">Plan</div>
      <div className="minimap-canvas">
        {buildings.map((b) => {
          const meta = BUILDING_META[b.type];
          const selected = b.id === selectedId;
          return (
            <button
              key={b.id}
              className={`mm-bldg ${selected ? 'is-selected' : ''} ${
                b.state === 'UNDER_CONSTRUCTION' ? 'is-building' : ''
              }`}
              style={{
                left: `${(b.x / MAP_W) * 100}%`,
                top: `${(b.y / MAP_H) * 100}%`,
                width: `${(b.w / MAP_W) * 100}%`,
                height: `${(b.h / MAP_H) * 100}%`,
                background: meta.color,
              }}
              title={b.name}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(b);
              }}
            />
          );
        })}

        {guards.map((g) => (
          <span
            key={`g-${g.id}`}
            className="mm-guard"
            style={{
              left: `${(g.x / MAP_W) * 100}%`,
              top: `${(g.y / MAP_H) * 100}%`,
            }}
            title={`${g.name} — ronde`}
          />
        ))}

        {inmateDots.map((d) => (
          <span
            key={`i-${d.id}`}
            className="mm-inmate"
            style={{
              left: `${(d.x / MAP_W) * 100}%`,
              top: `${(d.y / MAP_H) * 100}%`,
            }}
          />
        ))}

        {latestEvent && (
          <span
            className={`mm-event t-${latestEvent.severity}`}
            title={`${recentEvents.length} événement(s) récent(s)`}
          />
        )}
      </div>
    </div>
  );
}
