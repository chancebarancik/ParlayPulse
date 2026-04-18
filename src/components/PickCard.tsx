import type { Pick } from '../lib/types';

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-red-100 text-red-800 border-red-200',
};

function confidenceLevel(c: number) {
  if (c >= 70) return 'high';
  if (c >= 50) return 'medium';
  return 'low';
}

const CATEGORY_LABELS: Record<string, string> = {
  game: 'Game',
  player_prop: 'Player Prop',
  team_prop: 'Team Prop',
  method: 'Method',
  round: 'Round',
  inning: 'Inning',
};

interface PickCardProps {
  pick: Pick;
  selected?: boolean;
  onToggle?: (pick: Pick) => void;
}

export function PickCard({ pick, selected, onToggle }: PickCardProps) {
  const level = confidenceLevel(pick.confidence);
  const colors = CONFIDENCE_COLORS[level];

  return (
    <button
      onClick={() => onToggle?.(pick)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {pick.sport}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{pick.pick_type}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {CATEGORY_LABELS[pick.pick_category] ?? pick.pick_category}
            </span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{pick.pick_label}</p>
          {pick.event_title && (
            <p className="text-xs text-gray-500 mt-0.5">{pick.event_title}</p>
          )}
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{pick.reasoning}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors}`}>
            {pick.confidence.toFixed(0)}%
          </span>
          {pick.odds && (
            <span className="text-sm font-mono font-semibold text-gray-700">
              {pick.odds}
            </span>
          )}
          {pick.edge != null && (
            <span className={`text-xs font-mono font-medium ${
              pick.edge > 0 ? 'text-emerald-600' : pick.edge < -3 ? 'text-red-500' : 'text-gray-400'
            }`}>
              Edge: {pick.edge > 0 ? '+' : ''}{pick.edge.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
