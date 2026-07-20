import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface ThreatGaugeProps {
  /** Niveau de menace 0-100 (plus haut = plus dangereux). */
  threat: number;
}

function threatBand(t: number) {
  if (t >= 66) return { label: 'Critique', color: 'var(--danger)', Icon: AlertTriangle };
  if (t >= 33) return { label: 'Élevé', color: 'var(--warn)', Icon: ShieldAlert };
  return { label: 'Maîtrisé', color: 'var(--success)', Icon: ShieldCheck };
}

export function ThreatGauge({ threat }: ThreatGaugeProps) {
  const t = Math.max(0, Math.min(100, threat));
  const band = threatBand(t);

  // Demi-cercle : 180° d'arc, de gauche (0) à droite (100).
  const w = 150;
  const h = 84;
  const cx = w / 2;
  const cy = h - 6;
  const r = 64;
  const stroke = 11;

  const polar = (pct: number) => {
    const angle = Math.PI * (1 - pct); // pct 0 -> π (gauche), 1 -> 0 (droite)
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const start = polar(0);
  const end = polar(1);
  const cur = polar(t / 100);

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  const valuePath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${cur.x} ${cur.y}`;

  const { Icon } = band;

  return (
    <div className="threat">
      <div className="threat-gauge">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <defs>
            <linearGradient id="threatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path d={trackPath} fill="none" stroke="var(--bg)" strokeWidth={stroke} strokeLinecap="round" />
          <path
            d={valuePath}
            fill="none"
            stroke="url(#threatGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <circle cx={cur.x} cy={cur.y} r={5.5} fill="#fff" stroke={band.color} strokeWidth={2} />
        </svg>
        <div className="readout">
          <div className="lvl" style={{ color: band.color }}>
            {Math.round(t)}
          </div>
          <div className="cap">MENACE</div>
        </div>
      </div>
      <div className="threat-meta">
        <div
          className="risk-tag"
          style={{ color: band.color, background: `color-mix(in srgb, ${band.color} 15%, transparent)` }}
        >
          <Icon />
          Risque {band.label.toLowerCase()}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          Indice agrégé de dangerosité de la population. Renforcez la sécurité pour le faire baisser.
        </div>
      </div>
    </div>
  );
}
