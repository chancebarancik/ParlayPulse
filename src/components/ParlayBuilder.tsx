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
  safe: { label: 'Safe', desc: 'High confidence, lower odds, 70%+ picks only' },
  balanced: { label: 'Balanced', desc: 'Mix of confidence and value, 55%+ picks' },
  aggressive: { label: 'Aggressive', desc: 'Higher odds, includes underdogs and props' },
};

export function ParlayBuilder({ selectedPicks, onRemovePick, sportFilter }: ParlayBuilderProps) {
  const { parlay, generating, error, generate } = useParlayBuilder();
  const [legs, setLegs] = useState(3);
  const [strategy, setStrategy] = useState<Strategy>('balanced');
  const [includeProps, setIncludeProps] = useState(false);

  const handleGenerate = () => generate(sportFilter ?? undefined, legs, strategy, includeProps);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
      <h3 className="font-bold text-gray-900 text-sm">Parlay Builder</h3>

      {selectedPicks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Selected Legs ({selectedPicks.length})
          </p>
          {selectedPicks.map(pick => (
            <div key={pick.id} className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{pick.pick_label}</p>
                <p className="text-xs text-gray-500 truncate">{pick.event_title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pick.edge != null && (
                  <span className={`text-xs font-mono ${pick.edge > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {pick.edge > 0 ? '+' : ''}{pick.edge.toFixed(1)}%
                  </span>
                )}
                <span className="text-xs font-mono font-semibold text-gray-700">{pick.odds}</span>
                <button
                  onClick={() => onRemovePick(pick)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs text-gray-500 font-medium">AI Parlay Generator</p>

        <div>
          <label className="text-xs text-gray-600 block mb-1">Strategy</label>
          <div className="grid grid-cols-3 gap-1">
            {STRATEGIES.map(s => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
                  strategy === s
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {STRATEGY_INFO[s].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{STRATEGY_INFO[strategy].desc}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Legs:</label>
            <select
              value={legs}
              onChange={e => setLegs(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1"
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
              className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
            />
            <span className="text-xs text-gray-600">Include Props</span>
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generating...' : 'Generate AI Parlay'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {parlay && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                {parlay.strategy} Parlay
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-gray-900">{parlay.combined_odds}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {parlay.confidence_avg.toFixed(0)}% avg
              </span>
            </div>
          </div>
          {parlay.combined_implied_prob != null && (
            <p className="text-xs text-gray-500">
              Combined probability: {parlay.combined_implied_prob.toFixed(1)}%
            </p>
          )}
          <p className="text-xs text-gray-700">{parlay.reasoning}</p>
          {parlay.picks && parlay.picks.length > 0 && (
            <div className="space-y-1 pt-1">
              {parlay.picks.map((pick: Pick) => (
                <div key={pick.id} className="flex items-center justify-between bg-white/60 rounded px-2 py-1">
                  <span className="text-xs text-gray-800 font-medium truncate">{pick.pick_label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-gray-500">{pick.pick_category}</span>
                    <span className="text-xs font-mono text-gray-700">{pick.odds}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
