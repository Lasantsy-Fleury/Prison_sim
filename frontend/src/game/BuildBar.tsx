import { Hammer, X, Check } from 'lucide-react';
import { BUILDING_META } from './types';
import { BuildCatalogItem } from '../api/types';

interface BuildBarProps {
  catalog: BuildCatalogItem[];
  budget: number;
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
}

export function BuildBar({ catalog, budget, selectedType, onSelectType }: BuildBarProps) {
  return (
    <aside className="build-bar">
      <div className="build-bar-head">
        <h3>
          <Hammer size={16} />
          Construction
        </h3>
        {selectedType ? (
          <button className="btn btn-sm btn-primary" onClick={() => onSelectType(null)}>
            <Check size={14} /> Terminer
          </button>
        ) : (
          <button className="btn btn-sm btn-ghost" onClick={() => onSelectType(null)} title="Fermer">
            <X size={14} />
          </button>
        )}
      </div>

      {selectedType && (
        <p className="build-hint muted">
          Cliquez sur la carte pour placer le bâtiment. Le coût est déduit du budget.
        </p>
      )}

      <div className="build-list">
        {catalog.map((item) => {
          const meta = BUILDING_META[item.type as keyof typeof BUILDING_META];
          const Icon = meta?.icon ?? Hammer;
          const affordable = budget >= item.buildCost;
          const active = selectedType === item.type;
          return (
            <button
              key={item.type}
              className={`build-item ${active ? 'is-active' : ''}`}
              disabled={!affordable}
              onClick={() => onSelectType(active ? null : item.type)}
            >
              <span className="build-item-ic" style={{ color: meta?.color }}>
                <Icon size={18} />
              </span>
              <span className="build-item-body">
                <span className="build-item-name">{item.label}</span>
                <span className="build-item-cost">{item.buildCost} €</span>
              </span>
              {!affordable && <X size={12} className="build-item-lock" />}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
