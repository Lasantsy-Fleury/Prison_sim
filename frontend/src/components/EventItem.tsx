import { PrisonEvent } from '../api/types';
import { EVENT_LABELS, severityClass } from '../lib/format';
import { EVENT_ICONS, severityTile } from '../lib/icons';

interface EventItemProps {
  event: PrisonEvent;
}

export function EventItem({ event }: EventItemProps) {
  const Icon = EVENT_ICONS[event.type];
  return (
    <div className="event-item">
      <div className={severityTile(event.severity)}>
        <Icon />
      </div>
      <div className="event-body">
        <div className="row between">
          <div className="title">{event.title}</div>
          <span className="day-pill">J{event.day}</span>
        </div>
        <div className="meta">
          {EVENT_LABELS[event.type]}
          {' · '}
          <span className={`badge ${severityClass(event.severity)}`}>{event.severity}</span>
        </div>
        {event.description && <div className="desc">{event.description}</div>}
      </div>
    </div>
  );
}
