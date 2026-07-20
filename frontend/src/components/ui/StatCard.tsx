import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: LucideIcon;
}

export function StatCard({ label, value, sub, accent, icon: Icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="label">
        {Icon && <Icon />}
        {label}
      </div>
      <div className="value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
