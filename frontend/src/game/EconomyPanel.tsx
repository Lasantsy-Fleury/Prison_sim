import { Modal } from '../components/ui/Modal';
import { useEconomy } from '../hooks/usePrisonActions';
import { useGame } from './useGame';
import { TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function EconomyPanel({ onClose }: { onClose: () => void }) {
  const economy = useEconomy();
  const game = useGame();
  const bd = economy.data;
  const budget = game.dashboard.data?.budget ?? 0;
  const net = bd?.net ?? 0;

  return (
    <Modal title="Économie de la prison" onClose={onClose}>
      <div className="eco-summary">
        <div className="eco-box">
          <div className="label">Budget</div>
          <div className="eco-budget">{budget} €</div>
        </div>
        <div className="eco-box">
          <div className="label">Net / jour</div>
          <div className={`eco-net ${net >= 0 ? 'pos' : 'neg'}`}>
            {net >= 0 ? '+' : ''}
            {net} €
          </div>
        </div>
      </div>

      <div className="eco-cols">
        <div className="eco-col">
          <h4 className="eco-col-head pos">
            <TrendingUp size={15} /> Revenus
          </h4>
          {(bd?.revenue ?? []).map((l) => (
            <div key={l.label} className="eco-line">
              <span>{l.label}</span>
              <span className="eco-amt pos">+{l.amount} €</span>
            </div>
          ))}
          <div className="eco-total">
            <span>Total revenus</span>
            <span className="eco-amt pos">{bd?.totalRevenue ?? 0} €</span>
          </div>
        </div>

        <div className="eco-col">
          <h4 className="eco-col-head neg">
            <TrendingDown size={15} /> Dépenses
          </h4>
          {(bd?.expenses ?? []).map((l) => (
            <div key={l.label} className="eco-line">
              <span>{l.label}</span>
              <span className="eco-amt neg">−{l.amount} €</span>
            </div>
          ))}
          <div className="eco-total">
            <span>Total dépenses</span>
            <span className="eco-amt neg">{bd?.totalExpenses ?? 0} €</span>
          </div>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 11, marginTop: 14 }}>
        Le règlement est appliqué automatiquement à chaque jour avancé. Construction,
        agrandissement et salaires sont déduits du budget en temps réel.
      </p>

      <div className="eco-legend">
        <span><ArrowUpRight size={12} /> Revenu</span>
        <span><ArrowDownRight size={12} /> Dépense</span>
      </div>
    </Modal>
  );
}
