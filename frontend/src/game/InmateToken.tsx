import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GameInmate } from './types';
import { scoreColor } from '../lib/format';

export function InmateToken({ inmate }: { inmate: GameInmate }) {
  const navigate = useNavigate();
  const color = scoreColor(inmate.behaviorScore);
  return (
    <motion.div
      className="tok tok-inmate"
      onClick={() => navigate(`/inmates/${inmate.id}`)}
      initial={false}
      animate={{
        left: `${(inmate.px / 1000) * 100}%`,
        top: `${(inmate.py / 640) * 100}%`,
      }}
      transition={{ type: 'spring', stiffness: 60, damping: 14 }}
      style={{ borderColor: color }}
      title={`${inmate.name} — score ${inmate.behaviorScore}`}
    >
      <span style={{ background: color }} />
    </motion.div>
  );
}
