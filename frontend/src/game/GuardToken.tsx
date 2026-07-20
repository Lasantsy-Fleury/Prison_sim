import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Guard } from './types';

export function GuardToken({
  guard,
  x,
  y,
}: {
  guard: Guard;
  x: number;
  y: number;
}) {
  return (
    <motion.div
      className="tok tok-guard"
      initial={false}
      animate={{
        left: `${(x / 1000) * 100}%`,
        top: `${(y / 640) * 100}%`,
      }}
      transition={{ type: 'spring', stiffness: 50, damping: 16 }}
      title={`${guard.name} — ronde`}
    >
      <ShieldCheck size={13} />
    </motion.div>
  );
}
