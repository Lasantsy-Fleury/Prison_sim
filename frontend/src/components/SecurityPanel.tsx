import { useState } from 'react';
import { Shield, Banknote, AlertTriangle, Plus } from 'lucide-react';
import { useIncreaseSecurity } from '../hooks/usePrisonActions';
import { useToast } from './Toast';

interface SecurityPanelProps {
  securityLevel: number;
  budget: number;
}

const STEPS = [5, 10, 20];
const COST_PER_POINT = 5; // aligné sur le backend (amount * 5)

export function SecurityPanel({ securityLevel, budget }: SecurityPanelProps) {
  const increase = useIncreaseSecurity();
  const { notify } = useToast();
  const [amount, setAmount] = useState(10);

  const current = Math.max(0, Math.min(100, securityLevel));
  const headroom = 100 - current;
  const effective = Math.min(amount, headroom); // on ne dépasse jamais 100
  const cost = effective * COST_PER_POINT;
  const preview = Math.min(100, current + effective);

  const atMax = headroom <= 0;
  const tooPoor = cost > budget;
  const disabled = increase.isPending || atMax || tooPoor || effective <= 0;

  const apply = async () => {
    if (disabled) return;
    try {
      await increase.mutateAsync(effective);
      notify(`Sécurité renforcée de +${effective} (−${cost} €).`);
    } catch (err: any) {
      notify(err?.response?.data?.message ?? 'Renforcement impossible.', true);
    }
  };

  return (
    <div className="sec-panel">
      <div className="sec-head">
        <div className="title">
          <span className="shield">
            <Shield />
          </span>
          <div>
            <h2>Gestion de la sécurité</h2>
            <div className="eyebrow" style={{ marginTop: 2 }}>
              Poste de commandement
            </div>
          </div>
        </div>
        <div className="lvl-now">
          Niveau <b>{current}</b>/100
        </div>
      </div>

      <div className="sec-meter">
        <span style={{ width: `${current}%` }} />
        <span
          className={`sec-meter-preview ${effective > 0 && !atMax ? 'show' : ''}`}
          style={{ left: `${preview}%` }}
        />
      </div>
      <div className="sec-scale">
        <span>0</span>
        <span>Actuel {current}{effective > 0 && !atMax ? ` ≈ ${preview}` : ''}</span>
        <span>100</span>
      </div>

      <div className="sec-controls">
        <div className="sec-amounts" role="group" aria-label="Points de sécurité à ajouter">
          {STEPS.map((s) => (
            <button
              key={s}
              className={`sec-chip ${amount === s ? 'active' : ''}`}
              onClick={() => setAmount(s)}
              disabled={increase.isPending}
            >
              +{s}
            </button>
          ))}
        </div>
        <span className="sec-cost">
          <Banknote />
          Coût&nbsp;<b>{cost} €</b>&nbsp;· budget {budget} €
        </span>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={apply} disabled={disabled}>
          <Plus />
          {increase.isPending ? 'Déploiement…' : `Renforcer +${effective || amount}`}
        </button>
      </div>

      {atMax && (
        <div className="sec-hint" style={{ color: 'var(--success)' }}>
          <Shield />
          Sécurité au maximum. La prison est verrouillée.
        </div>
      )}
      {!atMax && tooPoor && (
        <div className="sec-hint">
          <AlertTriangle />
          Budget insuffisant : il faut {cost} € pour ce renforcement (disponible {budget} €).
        </div>
      )}
    </div>
  );
}
