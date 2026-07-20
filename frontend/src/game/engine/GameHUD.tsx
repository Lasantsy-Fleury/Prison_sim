// In-canvas HUD overlay: clock, objectives, live event log, notifications,
// selected-entity card and the real-time control bar (spec §14).

import { useEffect, useState } from 'react';
import {
  Sun,
  CloudRain,
  CloudFog,
  Target,
  Check,
  Circle,
  Users,
  Shield,
  Flame,
  Flag,
  ScrollText,
  Crosshair,
  Maximize,
  Type,
  Volume2,
  Wallet,
  Pause,
  Play,
  SkipForward,
  X,
  Banknote,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import type { GameEngine, HudState } from './GameEngine';
import { formatTime } from './core/MathUtils';
import { LogIcon } from '../../lib/icons';

interface Props {
  engine: GameEngine;
  onAdvanceDay: () => void;
  onOpenEconomy: () => void;
  onOpenAvatar: () => void;
}

const WEATHER_ICON = { clear: Sun, rain: CloudRain, fog: CloudFog } as const;

export function GameHUD({ engine, onAdvanceDay, onOpenEconomy, onOpenAvatar }: Props) {
  const [hud, setHud] = useState<HudState | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string; kind: string }[]>([]);

  useEffect(() => engine.onHud(setHud), [engine]);

  // notifications → transient toasts
  useEffect(() => {
    if (!hud) return;
    const latest = hud.notifications[0];
    if (!latest) return;
    setToasts((prev) => {
      if (prev.some((t) => t.id === latest.id)) return prev;
      return [latest, ...prev].slice(0, 4);
    });
  }, [hud?.notifications]);

  if (!hud) return null;

  const speeds = [0.5, 1, 2, 3];
  const phaseLabel: Record<string, string> = { NUIT: 'Nuit', MATIN: 'Matin', JOUR: 'Jour', SOIR: 'Soir' };
  const WeatherIcon = WEATHER_ICON[hud.weather];

  return (
    <div className="hud">
      {/* clock */}
      <div className="hud-clock">
        <div className="hud-clock-top">
          <span className="hud-day">Jour {hud.day}</span>
          <span className="hud-live">
            <span className="hud-live-dot" />
            LIVE
          </span>
        </div>
        <div className="hud-time">
          {formatTime(hud.hour, hud.minute)} <span className="hud-phase">{phaseLabel[hud.phase]}</span>
        </div>
        <div className="hud-badges">
          <span className="hud-badge">
            <WeatherIcon size={13} />
          </span>
          <span className={`hud-badge ${hud.paused ? 'is-paused' : ''}`}>
            {hud.paused ? (
              <>
                <Pause size={11} /> Pause
              </>
            ) : (
              <>
                <Play size={11} /> {hud.speed}×
              </>
            )}
          </span>
        </div>
      </div>

      {/* objectives + gangs */}
      <div className="hud-panel hud-objectives">
        <div className="hud-title">
          <Target size={13} /> Objectifs
        </div>
        {hud.objectives.map((o) => (
          <div key={o.id} className="hud-obj">
            <div className="hud-obj-row">
              <span>{o.title}</span>
              <span className={o.done ? 'ok' : 'bad'}>
                {o.done ? <Check size={13} /> : <Circle size={13} />}
              </span>
            </div>
            <div className="hud-obj-desc">{o.desc}</div>
            {!o.done && (
              <div className="hud-bar">
                <div
                  className="hud-bar-fill"
                  style={{ width: `${Math.min(100, (o.value / Math.max(1, o.target)) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
        <div className="hud-stats-mini">
          <span>
            <Users size={13} /> {hud.population}
          </span>
          <span>
            <Shield size={13} /> {hud.guards}
          </span>
          <span>
            <Flame size={13} /> {hud.fights}
          </span>
          <span>
            <Flag size={13} /> {hud.gangs}
          </span>
        </div>
      </div>

      {/* live log */}
      <div className="hud-panel hud-log">
        <div className="hud-title">
          <ScrollText size={13} /> Événements en direct
        </div>
        <div className="hud-log-list">
          {hud.log.map((l) => (
            <div key={l.id} className={`hud-log-item ${l.level}`}>
              <LogIcon name={l.icon} />
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* selected entity card */}
      {hud.selected && <SelectedCard sel={hud.selected} engine={engine} />}

      {/* toasts */}
      <div className="hud-toasts">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`hud-toast ${t.kind}`}
            onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* control bar */}
      <div className="hud-controls">
        <button
          className={`hud-btn ${hud.paused ? '' : 'active'}`}
          onClick={() => engine.togglePause()}
          title="Espace — Pause / Lecture"
        >
          {hud.paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        {speeds.map((s) => (
          <button
            key={s}
            className={`hud-btn ${!hud.paused && hud.speed === s ? 'active' : ''}`}
            onClick={() => engine.setSpeed(s)}
            title={`Vitesse ${s}×`}
          >
            {s}×
          </button>
        ))}
        <span className="hud-sep" />
        <button className="hud-btn" onClick={() => engine.followSelected()} title="F — Suivre la sélection">
          <Crosshair size={15} />
        </button>
        <button className="hud-btn" onClick={() => engine.resetView()} title="R — Recentrer">
          <Maximize size={15} />
        </button>
        <button className="hud-btn" onClick={() => engine.toggleNames()} title="N — Afficher les noms">
          <Type size={15} />
        </button>
        <button className="hud-btn" onClick={() => engine.toggleMute()} title="M — Son">
          <Volume2 size={15} />
        </button>
        <button
          className="hud-btn"
          onClick={() => engine.setWeather(hud.weather === 'clear' ? 'rain' : hud.weather === 'rain' ? 'fog' : 'clear')}
          title="Météo"
        >
          <WeatherIcon size={15} />
        </button>
        <span className="hud-sep" />
        <button className="hud-btn primary" onClick={onOpenAvatar} title="Créer un détenu">
          <UserPlus size={15} /> Détenu
        </button>
        <button className="hud-btn" onClick={onOpenEconomy} title="Économie">
          <Wallet size={15} />
        </button>
        <button className="hud-btn" onClick={onAdvanceDay} title="Passer au jour suivant">
          <SkipForward size={15} /> Jour
        </button>
      </div>
    </div>
  );
}

function SelectedCard({ sel, engine }: { sel: NonNullable<HudState['selected']>; engine: GameEngine }) {
  const needList: [string, number][] = [
    ['Faim', sel.needs.hunger],
    ['Fatigue', sel.needs.fatigue],
    ['Hygiène', sel.needs.hygiene],
    ['Stress', sel.needs.stress],
    ['Santé', sel.needs.health],
    ['Solitude', sel.needs.loneliness],
    ['Sécurité', sel.needs.security],
    ['Liberté', sel.needs.freedom],
    ['Confiance', sel.needs.confidence],
    ['Respect', sel.needs.respect],
  ];
  const traitList: [string, number][] = [
    ['Intelligence', sel.traits.intelligence],
    ['Peur', sel.traits.fear],
    ['Agressivité', sel.traits.aggressiveness],
    ['Moral', sel.traits.morale],
    ['Discipline', sel.traits.discipline],
    ['Empathie', sel.traits.empathy],
    ['Sociabilité', sel.traits.sociability],
  ];
  const KindIcon = sel.kind === 'guard' ? ShieldCheck : User;

  return (
    <div className="hud-panel hud-selected">
      <div className="hud-title">
        <span className="hud-sel-name">
          <KindIcon size={14} /> {sel.name}
        </span>
        <button className="hud-close" onClick={() => engine.selection.clear()}>
          <X size={14} />
        </button>
      </div>
      <div className="hud-sel-tags">
        <span className={`tag state-${sel.state}`}>{sel.state}</span>
        {sel.gang && <span className="tag gang">{sel.gang}</span>}
        <span className="tag">Humeur {sel.mood}</span>
        <span className="tag">PV {sel.health}</span>
        <span className="tag">Répu {sel.reputation}</span>
      </div>
      <div className="hud-sel-grid">
        <div>
          <div className="hud-sub">Besoins</div>
          {needList.map(([k, v]) => (
            <NeedBar key={k} label={k} value={v} />
          ))}
        </div>
        <div>
          <div className="hud-sub">Traits</div>
          {traitList.map(([k, v]) => (
            <NeedBar key={k} label={k} value={v} />
          ))}
          <div className="hud-sub">Psychologie</div>
          <div className="hud-psy">
            <span>{sel.psychology.orientation}</span>
            <span>{sel.psychology.temperament}</span>
          </div>
          <div className="hud-sub">Inventaire</div>
          <div className="hud-inv">
            <span className="hud-inv-money">
              <Banknote size={12} /> {sel.inventory.money}
            </span>
            {sel.inventory.items.length === 0 && <span className="muted"> (vide)</span>}
            {sel.inventory.items.map((it, i) => (
              <span key={i} className={it.contraband ? 'contraband' : ''}>
                {it.label} ×{it.qty}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NeedBar({ label, value }: { label: string; value: number }) {
  const color = value > 75 ? '#ff5b5b' : value > 45 ? '#ffb84d' : '#5ad17a';
  return (
    <div className="need">
      <span className="need-label">{label}</span>
      <div className="need-track">
        <div className="need-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="need-val">{Math.round(value)}</span>
    </div>
  );
}
