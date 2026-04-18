import type { Sport } from '../lib/types';
import { SPORTS } from '../lib/types';

interface SportFilterProps {
  active: Sport | null;
  onChange: (sport: Sport | null) => void;
}

export function SportFilter({ active, onChange }: SportFilterProps) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onChange(null)}
        className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
          active === null
            ? 'bg-dk-green/10 text-dk-green'
            : 'text-dk-textMuted hover:text-dk-textSecondary'
        }`}
      >
        All
      </button>
      {SPORTS.map(sport => (
        <button
          key={sport}
          onClick={() => onChange(sport)}
          className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            active === sport
              ? 'bg-dk-green/10 text-dk-green'
              : 'text-dk-textMuted hover:text-dk-textSecondary'
          }`}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}
