import { useEffect, useRef, useState } from 'react';
import { Play, Pause, ChevronRight } from 'lucide-react';
import { useAdvanceDays } from '../hooks/usePrisonActions';

interface SimControlsProps {
  day: number;
}

export function SimControls({ day }: SimControlsProps) {
  const advance = useAdvanceDays();
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(3);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (auto) {
      timer.current = setInterval(() => {
        advance.mutate(1);
      }, speed * 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [auto, speed, advance]);

  return (
    <div className="card">
      <div className="toolbar between" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            JOURNÉE SIMULÉE
          </div>
          <div className="sim-day">
            <span className="num">Jour {day}</span>
          </div>
        </div>
        <span className={`sim-state-pill ${auto ? 'running' : 'paused'}`}>
          {auto ? (
            <>
              <span className="pulse" />
              AUTO
            </>
          ) : (
            <>
              <Pause />
              PAUSE
            </>
          )}
        </span>
      </div>

      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={advance.isPending}
          onClick={() => advance.mutate(1)}
        >
          {advance.isPending ? 'Simulation…' : 'Avancer 1 jour'}
        </button>
        <button className="btn" disabled={advance.isPending} onClick={() => advance.mutate(7)}>
          +7 jours
        </button>
        <button
          className={auto ? 'btn btn-danger' : 'btn'}
          disabled={advance.isPending && !auto}
          onClick={() => setAuto((a) => !a)}
        >
          {auto ? (
            <>
              <Pause />
              Pause
            </>
          ) : (
            <>
              <Play />
              Lecture auto
            </>
          )}
        </button>
      </div>

      {auto && (
        <div className="row" style={{ marginTop: 12 }}>
          <span className="muted" style={{ fontSize: 12 }}>
            Vitesse
          </span>
          <input
            className="range"
            style={{ maxWidth: 160 }}
            type="range"
            min={1}
            max={6}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="muted" style={{ fontSize: 12 }}>
            {speed}s
          </span>
        </div>
      )}

      {advance.data && advance.data.summary?.length > 0 && (
        <div
          className="card"
          style={{ marginTop: 14, background: 'var(--bg)', padding: 12 }}
        >
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Résumé du jour {advance.data.day} ({advance.data.generatedCount} événements)
          </div>
          {advance.data.summary.map((s: string, i: number) => (
            <div key={i} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <ChevronRight size={14} style={{ marginTop: 3, color: 'var(--accent)', flexShrink: 0 }} />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
