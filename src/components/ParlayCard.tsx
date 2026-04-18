import type { Parlay } from '../lib/types';

const STATUS_DOT: Record<Parlay['status'], string> = {
  win: 'bg-win',
  loss: 'bg-loss',
  pending: 'bg-pending',
};

export function ParlayCard({ parlay, onClick }: { parlay: Parlay; onClick?: () => void }) {
  const gain =
    parlay.status === 'win'
      ? `+$${(parlay.payout - parlay.wager).toFixed(0)}`
      : parlay.status === 'loss'
        ? `-$${parlay.wager.toFixed(0)}`
        : `$${parlay.payout.toFixed(0)} to win`;
  const gainClass =
    parlay.status === 'win'
      ? 'text-win'
      : parlay.status === 'loss'
        ? 'text-loss'
        : 'text-pending';

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-line rounded-xl p-4 text-left w-full hover:border-ink/30 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[parlay.status]}`} />
          <span>{parlay.sport}</span>
          {parlay.scanned && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-full">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 5l2.5 2.5 3.5-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              scanned
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-ink/70 bg-canvas px-2 py-0.5 rounded-full">
          {parlay.book}
        </span>
      </div>
      <div className="text-[13px] text-ink/80 leading-relaxed mb-2">
        {parlay.legs.map((leg, i) => (
          <div key={i}>· {leg}</div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-line/60">
        <span className="text-xs text-muted">
          ${parlay.wager.toFixed(0)} · {parlay.odds ?? 'N/A'}
        </span>
        <span className={`text-sm font-bold ${gainClass}`}>{gain}</span>
      </div>
    </button>
  );
}
