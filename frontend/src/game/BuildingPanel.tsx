import { Modal } from '../components/ui/Modal';
import { BUILDING_META, Building } from './types';
import { useUpgradeBuilding, useExpandBuilding } from '../hooks/usePrisonActions';
import { useToast } from '../components/Toast';
import { Maximize2, Move, ArrowUpCircle } from 'lucide-react';

const STATE_LABEL: Record<Building['state'], string> = {
  OPERATIONAL: 'Opérationnel',
  UNDER_CONSTRUCTION: 'En construction',
  DAMAGED: 'Endommagé',
  OFFLINE: 'Hors service',
};

/** Coût estimé d'agrandissement (doit refléter backend.expand). */
function expandCost(b: Building): number {
  return Math.round(40 + b.capacity * 1.5 + b.level * 25);
}

export function BuildingPanel({
  building,
  onClose,
  onStartMove,
}: {
  building: Building;
  onClose: () => void;
  onStartMove: (id: number) => void;
}) {
  const upgrade = useUpgradeBuilding();
  const expand = useExpandBuilding();
  const { notify } = useToast();
  const meta = BUILDING_META[building.type];
  const Icon = meta.icon;

  const onUpgrade = async () => {
    try {
      await upgrade.mutateAsync(building.id);
      notify(`${building.name} amélioré (niveau ${building.level + 1}).`);
    } catch (err: any) {
      notify(err?.response?.data?.message ?? 'Amélioration impossible.', true);
    }
  };

  const onExpand = async () => {
    try {
      await expand.mutateAsync(building.id);
      notify(`${building.name} agrandi.`);
    } catch (err: any) {
      notify(err?.response?.data?.message ?? 'Agrandissement impossible.', true);
    }
  };

  const eCost = expandCost(building);
  const building_ = building.state === 'UNDER_CONSTRUCTION';

  return (
    <Modal title={building.name} onClose={onClose}>
      <div className="bldg-head">
        <span className="bldg-ic" style={{ color: meta.color, borderColor: meta.color }}>
          <Icon size={22} />
        </span>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>
            {meta.label}
          </div>
          <div style={{ fontWeight: 700 }}>
            {building.category === 'room' ? 'Bâtiment' : 'Installation de sécurité'}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ margin: '18px 0' }}>
        <div className="stat-card" style={{ padding: 12 }}>
          <div className="label">État</div>
          <div className="value" style={{ fontSize: 16 }}>{STATE_LABEL[building.state]}</div>
        </div>
        <div className="stat-card" style={{ padding: 12 }}>
          <div className="label">Capacité</div>
          <div className="value" style={{ fontSize: 16 }}>{building.capacity}</div>
        </div>
      </div>

      <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        Niveau d'amélioration : <b style={{ color: 'var(--accent)' }}>{building.level}</b>
      </div>

      <div className="btn-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={upgrade.isPending || building_}
          onClick={onUpgrade}
        >
          <ArrowUpCircle size={16} />
          Améliorer (capacité +15%)
        </button>

        <button
          className="btn"
          style={{ width: '100%' }}
          disabled={expand.isPending || building_}
          onClick={onExpand}
        >
          <Maximize2 size={16} />
          Agrandir (+taille & capacité) — {eCost} €
        </button>

        <button className="btn btn-ghost" style={{ width: '100%' }} disabled={building_} onClick={() => onStartMove(building.id)}>
          <Move size={16} />
          Déplacer sur la carte
        </button>
      </div>

      <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
        Améliorer augmente la capacité. Agrandir étend la surface et la capacité. Déplacer
        permet de réorganiser la prison par glisser-déposer.
      </p>
    </Modal>
  );
}
