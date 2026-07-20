import { CalendarDays, Clock, Banknote, Users, Shield, Smile, Meh, Frown, Wallet } from 'lucide-react';
import { GamePhase } from './types';

const PHASE_LABEL: Record<GamePhase, string> = {
  NUIT: 'Nuit',
  MATIN: 'Matin',
  JOUR: 'Jour',
  SOIR: 'Soir',
};

interface TopBarProps {
  day: number;
  hourLabel: string;
  phase: GamePhase;
  budget: number;
  net: number;
  population: number;
  security: number;
  satisfaction: number;
  onOpenEconomy: () => void;
}

export function GameTopBar({
  day,
  hourLabel,
  phase,
  budget,
  net,
  population,
  security,
  satisfaction,
  onOpenEconomy,
}: TopBarProps) {
  const SatIcon = satisfaction >= 60 ? Smile : satisfaction >= 35 ? Meh : Frown;
  const satColor = satisfaction >= 60 ? 'var(--success)' : satisfaction >= 35 ? 'var(--warn)' : 'var(--danger)';

  return (
    <header className="game-topbar">
      <div className="gtb-brand">
        <span className="brand-mark" style={{ width: 30, height: 30, borderRadius: 8 }}>
          <Shield size={17} />
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1.5, fontWeight: 600 }}>
          PRISONSIM
        </span>
      </div>
      <div className="gtb-items">
        <div className="gtb-item">
          <CalendarDays size={15} />
          <div>
            <div className="gtb-label">Jour</div>
            <div className="gtb-value">{day}</div>
          </div>
        </div>
        <div className="gtb-item">
          <Clock size={15} />
          <div>
            <div className="gtb-label">Heure</div>
            <div className="gtb-value">
              {hourLabel} <span className="gtb-sub">{PHASE_LABEL[phase]}</span>
            </div>
          </div>
        </div>
        <div className="gtb-item gtb-budget" onClick={onOpenEconomy} title="Ouvrir l'économie">
          <Banknote size={15} />
          <div>
            <div className="gtb-label">Budget</div>
            <div className="gtb-value">{budget} €</div>
          </div>
          <span className={`gtb-net ${net >= 0 ? 'pos' : 'neg'}`}>
            {net >= 0 ? '+' : ''}{net} €/j
          </span>
        </div>
        <div className="gtb-item">
          <Users size={15} />
          <div>
            <div className="gtb-label">Détenus</div>
            <div className="gtb-value">{population}</div>
          </div>
        </div>
        <div className="gtb-item">
          <Shield size={15} />
          <div>
            <div className="gtb-label">Sécurité</div>
            <div className="gtb-value">{security}</div>
          </div>
        </div>
        <div className="gtb-item">
          <SatIcon size={15} />
          <div>
            <div className="gtb-label">Satisfaction</div>
            <div className="gtb-value" style={{ color: satColor }}>
              {Math.round(satisfaction)}
            </div>
          </div>
        </div>
        <button className="btn btn-sm gtb-eco-btn" onClick={onOpenEconomy}>
          <Wallet size={15} />
          <span className="gtb-eco-btn-text">Économie</span>
        </button>
      </div>
    </header>
  );
}
