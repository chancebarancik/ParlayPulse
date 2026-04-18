import type { Pick } from '../lib/types';

function confidenceBg(c: number) {
  if (c >= 70) return 'bg-dk-green/15 text-dk-green border-dk-green/30';
  if (c >= 50) return 'bg-dk-orange/15 text-dk-orange border-dk-orange/30';
  return 'bg-dk-red/15 text-dk-red border-dk-red/30';
}

const CATEGORY_LABELS: Record<string, string> = {
  game: 'GAME',
  player_prop: 'PLAYER',
  team_prop: 'TEAM',
  method: 'METHOD',
  round: 'ROUND',
  inning: 'INNING',
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
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? 'border-dk-green bg-dk-green/10'
          : 'border-dk-border bg-dk-card hover:bg-dk-cardHover hover:border-dk-green/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-dk-green uppercase tracking-wider">
              {pick.sport}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-dk-surface text-dk-textMuted uppercase">
              {CATEGORY_LABELS[pick.pick_category] ?? pick.pick_category}
            </span>
            <span className="text-[10px] text-dk-textMuted">{pick.pick_type}</span>
          </div>
          <p className="font-bold text-white text-sm">{pick.pick_label}</p>
          {pick.event_title && (
            <p className="text-xs text-dk-textMuted mt-0.5">{pick.event_title}</p>
          )}
          <p className="text-xs text-dk-textSecondary mt-1.5 line-clamp-2">{pick.reasoning}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {pick.odds && (
            <span className="text-base font-mono font-bold text-white bg-dk-surface px-2.5 py-1 rounded-lg">
              {pick.odds}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${confidenceBg(pick.confidence)}`}>
            {pick.confidence.toFixed(0)}%
          </span>
          {pick.edge != null && (
            <span className={`text-[10px] font-mono font-semibold ${
              pick.edge > 0 ? 'text-dk-green' : pick.edge < -3 ? 'text-dk-red' : 'text-dk-textMuted'
            }`}>
              {pick.edge > 0 ? '+' : ''}{pick.edge.toFixed(1)}% edge
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
