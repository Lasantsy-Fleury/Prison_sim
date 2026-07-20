import { Inmate } from '../api/types';
import { scoreColor } from '../lib/format';
import { useNavigate } from 'react-router-dom';

export function InmateCard({ inmate }: { inmate: Inmate }) {
  const navigate = useNavigate();
  const color = scoreColor(inmate.behaviorScore);
  return (
    <div className="inmate-card" onClick={() => navigate(`/inmates/${inmate.id}`)}>
      <div className="top">
        <div>
          <div className="name">{inmate.name}</div>
          <div className="block">
            Bloc {inmate.block} · {inmate.age} ans
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color }}>{inmate.behaviorScore}</div>
          <div className="muted" style={{ fontSize: 10 }}>
            score
          </div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 8, gap: 6 }}>
        <span className="day-pill">INT {inmate.intelligence}</span>
        <span className="day-pill">PEUR {inmate.fear}</span>
        <span className="day-pill">AGGR {inmate.aggressiveness}</span>
        <span className="day-pill">MOR {inmate.morale}</span>
      </div>
      {inmate.status !== 'ACTIVE' && (
        <div className={`status-${inmate.status.toLowerCase()}`} style={{ marginTop: 6, fontSize: 12 }}>
          {inmate.status}
        </div>
      )}
    </div>
  );
}
