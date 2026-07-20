import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { PrisonEvent } from '../api/types';
import { EVENT_ICONS } from '../lib/icons';

export function EventMarker({
  event,
  x,
  y,
  onExpire,
}: {
  event: PrisonEvent;
  x: number;
  y: number;
  onExpire: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onExpire, 9000);
    return () => clearTimeout(t);
  }, [onExpire]);

  const Icon = EVENT_ICONS[event.type];
  return (
    <motion.div
      className="marker"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 640) * 100}%` }}
      title={event.title}
    >
      <span className={`marker-pulse t-${event.severity}`} />
      <span className={`marker-core t-${event.severity}`}>
        <Icon size={14} />
      </span>
    </motion.div>
  );
}
