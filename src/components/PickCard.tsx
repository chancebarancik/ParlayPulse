import type { Pick } from '../lib/types';

function confidenceColor(c: number) {
  if (c >= 70) return 'text-dk-green';
  if (c >= 50) return 'text-dk-orange';
  return 'text-dk-red';
}

const CATEGORY_LABELS: Record<string, string> = {
  game: 'Game',
  player_prop: 'Player',
  team_prop: 'Team',
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
  return (
    <button
      onClick={() => onToggle?.(pick)}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
        selected
          ? 'border-dk-green/40 bg-dk-greenMuted'
          : 'border-transparent bg-dk-card hover:bg-dk-cardHover'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-dk-green font-medium">{pick.sport}</span>
            <span className="text-[11px] text-dk-textMuted">
              {CATEGORY_LABELS[pick.pick_category] ?? pick.pick_category}
            </span>
            <span className="text-[11px] text-dk-textMuted">{pick.pick_type}</span>
          </div>
          <p className="font-medium text-dk-text text-[13px] leading-snug">{pick.pick_label}</p>
          {pick.event_title && (
            <p className="text-[11px] text-dk-textMuted mt-0.5">{pick.event_title}</p>
          )}
          <p className="text-[12px] text-dk-textSecondary mt-1.5 line-clamp-2 leading-relaxed">{pick.reasoning}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
          {pick.odds && (
            <span className="text-sm font-mono font-semibold text-dk-text">{pick.odds}</span>
          )}
          <span className={`text-[11px] font-mono ${confidenceColor(pick.confidence)}`}>
            {pick.confidence.toFixed(0)}%
          </span>
          {pick.edge != null && (
            <span className={`text-[11px] font-mono ${
              pick.edge > 0 ? 'text-dk-green' : pick.edge < -3 ? 'text-dk-red' : 'text-dk-textMuted'
            }`}>
              {pick.edge > 0 ? '+' : ''}{pick.edge.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
