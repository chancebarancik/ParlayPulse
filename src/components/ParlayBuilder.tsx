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
    <div className="bg-dk-surface rounded-xl border border-dk-border overflow-hidden">
      <div className="px-4 py-3 border-b border-dk-border">
        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Bet Slip</h3>
      </div>

      <div className="p-4 space-y-4">
        {selectedPicks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-dk-green font-bold uppercase tracking-widest">
              Selected ({selectedPicks.length})
            </p>
            {selectedPicks.map(pick => (
              <div key={pick.id} className="flex items-center justify-between bg-dk-card rounded-lg px-3 py-2 border border-dk-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{pick.pick_label}</p>
                  <p className="text-[10px] text-dk-textMuted truncate">{pick.event_title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pick.edge != null && (
                    <span className={`text-[10px] font-mono ${pick.edge > 0 ? 'text-dk-green' : 'text-dk-red'}`}>
                      {pick.edge > 0 ? '+' : ''}{pick.edge.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-white">{pick.odds}</span>
                  <button
                    onClick={() => onRemovePick(pick)}
                    className="text-dk-textMuted hover:text-dk-red transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[10px] text-dk-textSecondary font-bold uppercase tracking-widest">AI Generator</p>

          <div>
            <label className="text-[10px] text-dk-textMuted uppercase tracking-wide block mb-1.5">Strategy</label>
            <div className="grid grid-cols-3 gap-1">
              {STRATEGIES.map(s => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={`text-[10px] py-2 px-2 rounded-lg font-bold uppercase tracking-wide transition-all ${
                    strategy === s
                      ? 'bg-dk-green text-white'
                      : 'bg-dk-card text-dk-textSecondary hover:bg-dk-cardHover border border-dk-border'
                  }`}
                >
                  {STRATEGY_INFO[s].label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-dk-textMuted mt-1">{STRATEGY_INFO[strategy].desc}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-dk-textMuted uppercase tracking-wide">Legs</label>
              <select
                value={legs}
                onChange={e => setLegs(Number(e.target.value))}
                className="text-xs border border-dk-border rounded-lg px-2 py-1 bg-dk-card text-white"
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
                className="rounded border-dk-border text-dk-green bg-dk-card w-3.5 h-3.5"
              />
              <span className="text-[10px] text-dk-textSecondary uppercase tracking-wide">Props</span>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-lg bg-dk-green text-white text-xs font-bold uppercase tracking-wider hover:bg-dk-greenLight disabled:opacity-50 transition-all"
          >
            {generating ? 'Generating...' : 'Generate AI Parlay'}
          </button>
        </div>

        {error && <p className="text-xs text-dk-red">{error}</p>}

        {parlay && (
          <div className="rounded-lg bg-dk-card border border-dk-green/30 overflow-hidden">
            <div className="px-3 py-2 bg-dk-green/10 border-b border-dk-green/20 flex items-center justify-between">
              <span className="text-[10px] font-bold text-dk-green uppercase tracking-widest">
                {parlay.strategy} Parlay
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-white">{parlay.combined_odds}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-dk-green/20 text-dk-green">
                  {parlay.confidence_avg.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              {parlay.combined_implied_prob != null && (
                <p className="text-[10px] text-dk-textMuted">
                  Hit probability: {parlay.combined_implied_prob.toFixed(1)}%
                </p>
              )}
              <p className="text-xs text-dk-textSecondary">{parlay.reasoning}</p>
              {parlay.picks && parlay.picks.length > 0 && (
                <div className="space-y-1 pt-1">
                  {parlay.picks.map((pick: Pick) => (
                    <div key={pick.id} className="flex items-center justify-between bg-dk-surface rounded px-2.5 py-1.5">
                      <span className="text-xs text-white font-medium truncate">{pick.pick_label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-dk-textMuted uppercase">{pick.pick_category}</span>
                        <span className="text-xs font-mono font-bold text-dk-green">{pick.odds}</span>
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
