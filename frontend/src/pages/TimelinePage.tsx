import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { qk } from '../api/queryKeys';
import type { TimelinePage as TimelinePageData, PrisonEventType } from '../api/types';
import { EventItem } from '../components/EventItem';
import { EVENT_LABELS } from '../lib/format';

const TYPES: PrisonEventType[] = [
  'ESCAPE_ATTEMPT',
  'ESCAPE_SUCCESS',
  'FIGHT',
  'ALLIANCE',
  'CONFLICT',
  'CORRUPTION',
  'BEHAVIOR_CHANGE',
  'DECISION',
  'ARRIVAL',
  'TRANSFER',
  'RELEASE',
  'SECURITY_CHANGE',
  'INFO',
];

export function TimelinePage() {
  const [type, setType] = useState<PrisonEventType | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<TimelinePageData>({
    queryKey: qk.events({ type: type || undefined, page }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (type) params.set('type', type);
      return (await api.get(`/events?${params.toString()}`)).data;
    },
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <h1>Timeline des événements</h1>
      <p className="page-sub">Chronologie complète de la vie de votre prison.</p>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button
          className={`btn btn-sm ${type === '' ? 'btn-primary' : ''}`}
          onClick={() => {
            setType('');
            setPage(1);
          }}
        >
          Tous
        </button>
        {TYPES.map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${type === t ? 'btn-primary' : ''}`}
            onClick={() => {
              setType(t);
              setPage(1);
            }}
          >
            {EVENT_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading-wrap">
            <span className="spinner" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="empty">Aucun événement.</div>
        ) : (
          data.data.map((e) => <EventItem key={e.id} event={e} />)
        )}

        {totalPages > 1 && (
          <div className="row between" style={{ marginTop: 14 }}>
            <button
              className="btn btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
              Précédent
            </button>
            <span className="muted">
              Page {page} / {totalPages}
            </span>
            <button
              className="btn btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
