import { attrColor } from '../../lib/format';

interface AttributeBarProps {
  label: string;
  value: number;
  kind?: 'fear' | 'morale' | 'aggr' | 'intel';
}

export function AttributeBar({ label, value, kind }: AttributeBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="attr">
      <div className="attr-head">
        <span>{label}</span>
        <span className="num">{Math.round(value)}</span>
      </div>
      <div className="bar">
        <span
          style={{
            width: `${pct}%`,
            background: attrColor(value, kind),
          }}
        />
      </div>
    </div>
  );
}
