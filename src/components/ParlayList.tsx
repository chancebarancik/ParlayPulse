import type { Parlay } from '../lib/types';
import { ParlayCard } from './ParlayCard';

export function ParlayList({
  parlays,
  loading,
  onSelect,
}: {
  parlays: Parlay[];
  loading: boolean;
  onSelect?: (parlay: Parlay) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted text-sm">Loading parlays…</div>
    );
  }
  if (!parlays.length) {
    return (
      <div className="text-center py-8 text-muted text-sm">
        No parlays yet. Add one below.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5 mb-3">
      {parlays.map((p) => (
        <ParlayCard key={p.id} parlay={p} onClick={onSelect ? () => onSelect(p) : undefined} />
      ))}
    </div>
  );
}
