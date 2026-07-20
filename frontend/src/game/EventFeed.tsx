import { Activity } from 'lucide-react';
import { PrisonEvent } from '../api/types';
import { EventItem } from '../components/EventItem';

export function EventFeed({ events }: { events: PrisonEvent[] }) {
  const list = (events ?? []).slice(0, 24);
  return (
    <aside className="game-feed">
      <div className="feed-head">
        <h2>
          <Activity />
          Événements en direct
        </h2>
        <span className="day-pill">{list.length}</span>
      </div>
      <div className="feed-body">
        {list.length === 0 ? (
          <div className="empty">Aucun événement pour l’instant.</div>
        ) : (
          list.map((e) => <EventItem key={e.id} event={e} />)
        )}
      </div>
    </aside>
  );
}
