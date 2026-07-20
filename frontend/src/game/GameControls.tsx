import { Pause, Play, Gauge, FastForward, ChevronRight } from 'lucide-react';
import { GameSpeed } from './schedule';

const SPEEDS: { key: GameSpeed; label: string; Icon: any }[] = [
  { key: 'pause', label: 'Pause', Icon: Pause },
  { key: 'slow', label: 'Lent', Icon: Gauge },
  { key: 'normal', label: 'Normal', Icon: Play },
  { key: 'fast', label: 'Rapide', Icon: FastForward },
];

interface ControlsProps {
  speed: GameSpeed;
  setSpeed: (s: GameSpeed) => void;
  advancing: boolean;
  onAdvance: () => void;
  day: number;
}

export function GameControls({
  speed,
  setSpeed,
  advancing,
  onAdvance,
  day,
}: ControlsProps) {
  return (
    <footer className="game-controls">
      <div className="ctrl-speeds">
        {SPEEDS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`btn btn-sm ${speed === key ? 'btn-primary' : ''}`}
            onClick={() => setSpeed(key)}
            aria-pressed={speed === key}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      <div className="ctrl-right">
        <span className="muted" style={{ fontSize: 12 }}>
          Jour {day} · vitesse {SPEEDS.find((s) => s.key === speed)?.label}
        </span>
        <button
          className="btn btn-primary"
          disabled={advancing}
          onClick={onAdvance}
        >
          <ChevronRight size={15} />
          {advancing ? 'Simulation…' : 'Avancer 1 jour'}
        </button>
      </div>
    </footer>
  );
}
