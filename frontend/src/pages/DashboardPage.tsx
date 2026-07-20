import { useQuery } from '@tanstack/react-query';
import { Shield, ShieldAlert, Banknote, Users, History, UsersRound } from 'lucide-react';
import api from '../api/client';
import { qk } from '../api/queryKeys';
import { DashboardData } from '../api/types';
import { StatCard } from '../components/ui/StatCard';
import { SimControls } from '../components/SimControls';
import { SecurityPanel } from '../components/SecurityPanel';
import { ThreatGauge } from '../components/ThreatGauge';
import { EventItem } from '../components/EventItem';
import { InmateCard } from '../components/InmateCard';
import { useSeedInmates } from '../hooks/usePrisonActions';
import { useToast } from '../components/Toast';

export function DashboardPage() {
  const { notify } = useToast();
  const seed = useSeedInmates();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: qk.dashboard,
    queryFn: async () => (await api.get('/stats/dashboard')).data,
  });

  if (isLoading || !data) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
      </div>
    );
  }

  const empty = data.population === 0;

  return (
    <div>
      <div className="eyebrow">Poste de direction</div>
      <h1>Tableau de bord</h1>
      <p className="page-sub">
        {data.prisonName} — vue d’ensemble de votre établissement pénitentiaire.
      </p>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <SimControls day={data.day} />
        <div className="grid grid-2" style={{ alignContent: 'start' }}>
          <StatCard label="Sécurité" value={data.securityLevel} sub="/ 100" accent="var(--accent)" icon={Shield} />
          <StatCard label="Budget" value={`${data.budget} €`} accent="var(--success)" icon={Banknote} />
          <StatCard
            label="Population"
            value={data.population}
            sub={`${data.totalInmates} au total`}
            icon={Users}
          />
          <StatCard label="Évasions" value={data.escaped} accent="var(--danger)" icon={UsersRound} />
          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div className="label">
              <ShieldAlert size={14} /> Niveau de menace
            </div>
            <div style={{ marginTop: 12 }}>
              <ThreatGauge threat={data.threat} />
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de gestion de la sécurité — action du directeur */}
      <div style={{ marginBottom: 16 }}>
        <SecurityPanel securityLevel={data.securityLevel} budget={data.budget} />
      </div>

      {empty && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--accent)' }}>
          <h2>Prison vide</h2>
          <p className="muted">
            Aucun détenu n’est incarcéré. Ajoutez des détenus ou générez une population pour lancer la
            simulation.
          </p>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              disabled={seed.isPending}
              onClick={async () => {
                await seed.mutateAsync(10);
                notify('10 détenus générés et incarcérés.');
              }}
            >
              <Users />
              {seed.isPending ? 'Génération…' : 'Générer 10 détenus'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h2>
            <History />
            Événements récents
          </h2>
          {data.recentEvents.length === 0 ? (
            <div className="empty">Aucun événement pour l’instant.</div>
          ) : (
            data.recentEvents.map((e) => <EventItem key={e.id} event={e} />)
          )}
        </div>
        <div className="card">
          <h2>
            <Users />
            Détenus les plus instables
          </h2>
          <div className="grid grid-2">
            {data.activeInmates.map((i) => (
              <InmateCard key={i.id} inmate={i} />
            ))}
          </div>
          {data.activeInmates.length === 0 && (
            <div className="empty">Aucun détenu actif.</div>
          )}
        </div>
      </div>
    </div>
  );
}
