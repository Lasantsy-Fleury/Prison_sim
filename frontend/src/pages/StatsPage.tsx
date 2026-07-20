import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity, PieChart as PieIcon, BarChart3, Flame, Skull } from 'lucide-react';
import api from '../api/client';
import { qk } from '../api/queryKeys';
import { StatsData, PrisonEventType } from '../api/types';
import { StatCard } from '../components/ui/StatCard';
import { EVENT_LABELS } from '../lib/format';

const SERIES_COLORS: Record<string, string> = {
  ESCAPE_ATTEMPT: '#f59e0b',
  ESCAPE_SUCCESS: '#ef4444',
  FIGHT: '#ec4899',
  ALLIANCE: '#22c55e',
  CONFLICT: '#f97316',
  CORRUPTION: '#a855f7',
  BEHAVIOR_CHANGE: '#38bdf8',
};

const PIE_COLORS = ['#f5a524', '#ef4444', '#22c55e', '#38bdf8', '#a855f7', '#ec4899', '#f97316'];

export function StatsPage() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: qk.stats,
    queryFn: async () => (await api.get('/stats')).data,
  });

  const seriesData = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<number, any>();
    data.eventSeries.forEach((s) => {
      if (!byDay.has(s.day)) byDay.set(s.day, { day: s.day });
      byDay.get(s.day)[s.type] = (byDay.get(s.day)[s.type] ?? 0) + s.count;
    });
    return Array.from(byDay.values()).sort((a, b) => a.day - b.day);
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.eventTypeCounts).map(([type, count]) => ({
      name: EVENT_LABELS[type as PrisonEventType],
      value: count,
    }));
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
      </div>
    );
  }

  const avg = data.averages;

  return (
    <div>
      <h1>Statistiques</h1>
      <p className="page-sub">Analyse de la vie de votre prison au fil des journées simulées.</p>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="Population active" value={data.population} sub={`${data.totalInmates} total`} />
        <StatCard label="Évasions" value={data.escaped} accent="var(--danger)" />
        <StatCard label="Libérations" value={data.released} accent="var(--success)" />
        <StatCard label="Moral moyen" value={avg.morale} accent="var(--accent-2)" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>
        <Activity />
        Activité par journée
      </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243140" />
              <XAxis dataKey="day" stroke="#8b9bab" fontSize={12} />
              <YAxis stroke="#8b9bab" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#141b24', border: '1px solid #243140', color: '#e6edf3' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.keys(SERIES_COLORS).map((t) => (
                <Line
                  key={t}
                  type="monotone"
                  dataKey={t}
                  name={EVENT_LABELS[t as PrisonEventType]}
                  stroke={SERIES_COLORS[t]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>
            <BarChart3 />
            Répartition des comportements
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.behaviorBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243140" />
              <XAxis dataKey="range" stroke="#8b9bab" fontSize={12} />
              <YAxis stroke="#8b9bab" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#141b24', border: '1px solid #243140', color: '#e6edf3' }}
              />
              <Bar dataKey="count" name="Détenus" fill="#f5a524" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>
            <Flame />
            Moyennes des attributs
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { nom: 'Intelligence', val: avg.intelligence },
                { nom: 'Peur', val: avg.fear },
                { nom: 'Agressivité', val: avg.aggressiveness },
                { nom: 'Moral', val: avg.morale },
                { nom: 'Score', val: avg.behaviorScore },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#243140" />
              <XAxis dataKey="nom" stroke="#8b9bab" fontSize={12} />
              <YAxis stroke="#8b9bab" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#141b24', border: '1px solid #243140', color: '#e6edf3' }}
              />
              <Bar dataKey="val" name="Moyenne" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>
            <PieIcon />
            Répartition des événements
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={(e: any) => e.name}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#141b24', border: '1px solid #243140', color: '#e6edf3' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>
          <Skull />
          Détenus les plus dangereux
        </h2>
        <ResponsiveContainer width="100%" height={Math.max(140, data.dangerousInmates.length * 38)}>
          <BarChart layout="vertical" data={data.dangerousInmates}>
            <CartesianGrid strokeDasharray="3 3" stroke="#243140" />
            <XAxis type="number" domain={[0, 100]} stroke="#8b9bab" fontSize={12} />
            <YAxis type="category" dataKey="name" stroke="#8b9bab" fontSize={12} width={120} />
            <Tooltip
              contentStyle={{ background: '#141b24', border: '1px solid #243140', color: '#e6edf3' }}
            />
            <Bar dataKey="behaviorScore" name="Score" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
