import type { Parlay } from '../lib/types';
import { formatSignedMoney } from '../lib/format';

export function StatRow({ parlays }: { parlays: Parlay[] }) {
  let net = 0;
  let wins = 0;
  let wagered = 0;
  let settled = 0;
  for (const p of parlays) {
    wagered += p.wager;
    if (p.status === 'win') {
      net += p.payout - p.wager;
      wins++;
      settled++;
    } else if (p.status === 'loss') {
      net -= p.wager;
      settled++;
    }
  }
  const netClass = net >= 0 ? 'text-win' : 'text-loss';

  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      <Stat value={formatSignedMoney(net)} label="Net" valueClass={netClass} />
      <Stat value={`${wins}/${settled}`} label="Hit rate" />
      <Stat value={`$${wagered.toFixed(0)}`} label="Wagered" />
    </div>
  );
}

function Stat({
  value,
  label,
  valueClass = '',
}: {
  value: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white border border-line rounded-xl p-3 text-center">
      <div className={`text-xl font-bold ${valueClass}`}>{value}</div>
      <div className="text-[11px] text-muted mt-0.5">{label}</div>
    </div>
  );
}
