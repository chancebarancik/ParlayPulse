import type { Sport } from '../lib/types';
import { SPORTS } from '../lib/types';

interface SportFilterProps {
  active: Sport | null;
  onChange: (sport: Sport | null) => void;
}

const SPORT_ICONS: Record<Sport, string> = {
  UFC: '\u{1F94A}',
  MLB: '\u{26BE}',
  NFL: '\u{1F3C8}',
};

export function SportFilter({ active, onChange }: SportFilterProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active === null
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {SPORTS.map(sport => (
        <button
          key={sport}
          onClick={() => onChange(sport)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            active === sport
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {SPORT_ICONS[sport]} {sport}
        </button>
      ))}
    </div>
  );
}
