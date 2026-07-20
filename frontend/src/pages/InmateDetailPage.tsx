import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Gift, ArrowRightLeft, Unlock, Trash2, Gauge, Users, ShieldCheck, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { qk } from '../api/queryKeys';
import { Inmate, InmateRelation, PrisonEvent, TimelinePage } from '../api/types';
import { AttributeBar } from '../components/ui/AttributeBar';
import { ScoreGauge } from '../components/ScoreGauge';
import { EventItem } from '../components/EventItem';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useApplyDecision, useDeleteInmate } from '../hooks/usePrisonActions';
import { useToast } from '../components/Toast';

const BLOCKS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'];

export function InmateDetailPage() {
  const { id } = useParams();
  const inmateId = Number(id);
  const navigate = useNavigate();
  const { notify } = useToast();
  const decide = useApplyDecision();
  const remove = useDeleteInmate();
  const [showMove, setShowMove] = useState(false);
  const [block, setBlock] = useState('A1');

  const { data: inmate, isLoading } = useQuery<Inmate>({
    queryKey: qk.inmate(inmateId),
    queryFn: async () => (await api.get(`/inmates/${inmateId}`)).data,
  });

  const { data: relations } = useQuery<InmateRelation[]>({
    queryKey: qk.relations(inmateId),
    queryFn: async () => (await api.get(`/inmates/${inmateId}/relations`)).data,
  });

  const { data: eventsPage } = useQuery<TimelinePage>({
    queryKey: qk.events({ inmateId }),
    queryFn: async () => (await api.get(`/events?inmateId=${inmateId}&limit=30`)).data,
  });

  if (isLoading) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
      </div>
    );
  }
  if (!inmate) {
    return <div className="empty">Détenu introuvable.</div>;
  }

  const isActive = inmate.status === 'ACTIVE';

  const doDecision = async (body: any, msg: string) => {
    await decide.mutateAsync(body);
    notify(msg);
  };

  const onDelete = async () => {
    if (!window.confirm(`Supprimer ${inmate.name} du registre ?`)) return;
    await remove.mutateAsync(inmateId);
    notify(`${inmate.name} supprimé du registre.`);
    navigate('/inmates');
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inmates')}>
        <ArrowLeft />
        Retour
      </button>
      <div className="toolbar between" style={{ marginTop: 10 }}>
        <div>
          <h1>{inmate.name}</h1>
          <p className="page-sub">
            Bloc {inmate.block} · {inmate.age} ans ·{' '}
            <span className={`status-${inmate.status.toLowerCase()}`}>{inmate.status}</span>
          </p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          <Trash2 />
          Supprimer
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>
            <Gauge />
            Profil comportemental
          </h2>
          <div className="gauge-wrap" style={{ marginBottom: 14 }}>
            <ScoreGauge score={inmate.behaviorScore} />
            <div className="muted" style={{ fontSize: 12 }}>
              Score de comportement : plus il est bas, plus le détenu est dangereux / instable.
            </div>
          </div>
          <AttributeBar label="Intelligence" value={inmate.intelligence} kind="intel" />
          <AttributeBar label="Peur (docilité)" value={inmate.fear} kind="fear" />
          <AttributeBar label="Agressivité" value={inmate.aggressiveness} kind="aggr" />
          <AttributeBar label="Moral" value={inmate.morale} kind="morale" />
        </div>

        <div className="card">
          <h2>
            <Users />
            Relations
          </h2>
          {!relations || relations.length === 0 ? (
            <div className="empty">Aucune relation enregistrée.</div>
          ) : (
            relations.map((r) => (
              <div
                key={r.id}
                className="row between"
                style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{r.targetName ?? `#${r.inmateBId}`}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    force : {r.strength}
                  </div>
                </div>
                <Badge className={`badge-${r.type.toLowerCase()}`}>
                  {r.type === 'ALLY' ? 'Allié' : r.type === 'ENEMY' ? 'Ennemi' : 'Neutre'}
                </Badge>
              </div>
            ))
          )}

          {isActive && (
            <div style={{ marginTop: 16 }}>
              <h2>
                <ShieldCheck />
                Décisions du directeur
              </h2>
              <div className="btn-row">
                <button
                  className="btn btn-sm"
                  disabled={decide.isPending}
                  onClick={() => doDecision({ type: 'SANCTION', inmateId }, `${inmate.name} sanctionné.`)}
                >
                  <Ban />
                  Sanctionner
                </button>
                <button
                  className="btn btn-sm"
                  disabled={decide.isPending}
                  onClick={() => doDecision({ type: 'REWARD', inmateId }, `${inmate.name} récompensé.`)}
                >
                  <Gift />
                  Récompenser
                </button>
                <button className="btn btn-sm" onClick={() => setShowMove(true)}>
                  <ArrowRightLeft />
                  Déplacer
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={decide.isPending}
                  onClick={() => doDecision({ type: 'RELEASE', inmateId }, `${inmate.name} libéré.`)}
                >
                  <Unlock />
                  Libérer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>
          <History />
          Historique des événements
        </h2>
        {!eventsPage || eventsPage.data.length === 0 ? (
          <div className="empty">Aucun événement lié à ce détenu.</div>
        ) : (
          eventsPage.data.map((e: PrisonEvent) => <EventItem key={e.id} event={e} />)
        )}
      </div>

      {showMove && (
        <Modal title={`Déplacer ${inmate.name}`} onClose={() => setShowMove(false)}>
          <div className="field">
            <label>Nouveau bloc</label>
            <select className="select" value={block} onChange={(e) => setBlock(e.target.value)}>
              {BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={async () => {
              await doDecision({ type: 'MOVE_INMATE', inmateId, block }, `${inmate.name} déplacé vers ${block}.`);
              setShowMove(false);
            }}
          >
            Confirmer le transfert
          </button>
        </Modal>
      )}
    </div>
  );
}
