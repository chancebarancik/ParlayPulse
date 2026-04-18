import { useState } from 'react';
import type { Pick, Sport, Strategy } from '../lib/types';
import { STRATEGIES } from '../lib/types';
import { useParlayBuilder } from '../hooks/usePicks';

interface ParlayBuilderProps {
  selectedPicks: Pick[];
  onRemovePick: (pick: Pick) => void;
  sportFilter: Sport | null;
}

const STRATEGY_INFO: Record<Strategy, { label: string; desc: string }> = {
  safe: { label: 'Safe', desc: '70%+ confidence, lower odds' },
  balanced: { label: 'Balanced', desc: '55%+ confidence, mixed value' },
  aggressive: { label: 'Aggressive', desc: 'Higher odds, underdogs + props' },
};

export function ParlayBuilder({ selectedPicks, onRemovePick, sportFilter }: ParlayBuilderProps) {
  const { parlay, generating, error, generate } = useParlayBuilder();
  const [legs, setLegs] = useState(3);
  const [strategy, setStrategy] = useState<Strategy>('balanced');
  const [includeProps, setIncludeProps] = useState(false);

  const handleGenerate = () => generate(sportFilter ?? undefined, legs, strategy, includeProps);

  return (
    <div className="rounded-xl bg-dk-surface border border-dk-border/50">
      <div className="px-4 py-3 border-b border-dk-border/50">
        <h3 className="text-[12px] font-semibold text-dk-textSecondary tracking-wide uppercase">Bet Slip</h3>
      </div>

      <div className="p-4 space-y-5">
        {selectedPicks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-dk-textMuted mb-2">
              Selected ({selectedPicks.length})
            </p>
            {selectedPicks.map(pick => (
              <div key={pick.id} className="flex items-center justify-between bg-dk-card rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-dk-text truncate">{pick.pick_label}</p>
                  <p className="text-[11px] text-dk-textMuted truncate">{pick.event_title}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {pick.edge != null && (
                    <span className={`text-[11px] font-mono ${pick.edge > 0 ? 'text-dk-green' : 'text-dk-red'}`}>
                      {pick.edge > 0 ? '+' : ''}{pick.edge.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[12px] font-mono font-semibold text-dk-text">{pick.odds}</span>
                  <button
                    onClick={() => onRemovePick(pick)}
                    className="text-dk-textMuted hover:text-dk-red transition-colors p-0.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-[11px] text-dk-textMuted">AI Generator</p>

          <div>
            <label className="text-[11px] text-dk-textMuted block mb-2">Strategy</label>
            <div className="grid grid-cols-3 gap-1">
              {STRATEGIES.map(s => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={`text-[11px] py-1.5 px-2 rounded-md font-medium transition-all ${
                    strategy === s
                      ? 'bg-dk-green/10 text-dk-green'
                      : 'text-dk-textMuted hover:text-dk-textSecondary'
                  }`}
                >
                  {STRATEGY_INFO[s].label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-dk-textMuted mt-1.5">{STRATEGY_INFO[strategy].desc}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-dk-textMuted">Legs</label>
              <select
                value={legs}
                onChange={e => setLegs(Number(e.target.value))}
                className="text-[12px] border border-dk-border rounded-md px-2 py-1 bg-dk-card text-dk-text"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeProps}
                onChange={e => setIncludeProps(e.target.checked)}
                className="rounded border-dk-border text-dk-green bg-dk-card w-3 h-3"
              />
              <span className="text-[11px] text-dk-textMuted">Props</span>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 rounded-lg bg-dk-green text-white text-[12px] font-medium hover:bg-dk-greenLight disabled:opacity-50 transition-all"
          >
            {generating ? 'Generating...' : 'Generate Parlay'}
          </button>
        </div>

        {error && <p className="text-[12px] text-dk-red">{error}</p>}

        {parlay && (
          <div className="rounded-lg bg-dk-card border border-dk-green/15 overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-dk-green/10 flex items-center justify-between">
              <span className="text-[11px] text-dk-green font-medium capitalize">
                {parlay.strategy} parlay
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-mono font-semibold text-dk-text">{parlay.combined_odds}</span>
                <span className="text-[11px] font-mono text-dk-green">
                  {parlay.confidence_avg.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="p-3.5 space-y-2">
              {parlay.combined_implied_prob != null && (
                <p className="text-[11px] text-dk-textMuted">
                  Hit probability: {parlay.combined_implied_prob.toFixed(1)}%
                </p>
              )}
              <p className="text-[12px] text-dk-textSecondary leading-relaxed">{parlay.reasoning}</p>
              {parlay.picks && parlay.picks.length > 0 && (
                <div className="space-y-1 pt-1">
                  {parlay.picks.map((pick: Pick) => (
                    <div key={pick.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-dk-surface">
                      <span className="text-[12px] text-dk-text truncate">{pick.pick_label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-dk-textMuted">{pick.pick_category}</span>
                        <span className="text-[12px] font-mono text-dk-green">{pick.odds}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
