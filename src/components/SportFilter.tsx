import type { Sport } from '../lib/types';
import { SPORTS } from '../lib/types';

interface SportFilterProps {
  active: Sport | null;
  onChange: (sport: Sport | null) => void;
}

const SPORT_LABELS: Record<Sport, string> = {
  UFC: 'UFC',
  MLB: 'MLB',
  NFL: 'NFL',
};

export function SportFilter({ active, onChange }: SportFilterProps) {
  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
          active === null
            ? 'bg-dk-green text-white'
            : 'bg-dk-card text-dk-textSecondary hover:bg-dk-cardHover hover:text-white'
        }`}
      >
        All Sports
      </button>
      {SPORTS.map(sport => (
        <button
          key={sport}
          onClick={() => onChange(sport)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
            active === sport
              ? 'bg-dk-green text-white'
              : 'bg-dk-card text-dk-textSecondary hover:bg-dk-cardHover hover:text-white'
          }`}
        >
          {SPORT_LABELS[sport]}
        </button>
      ))}
    </div>
  );
}
