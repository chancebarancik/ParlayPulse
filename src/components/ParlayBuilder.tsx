import { useState } from 'react';
import type { Pick, Sport } from '../lib/types';
import { useParlayBuilder } from '../hooks/usePicks';

interface ParlayBuilderProps {
  selectedPicks: Pick[];
  onRemovePick: (pick: Pick) => void;
  sportFilter: Sport | null;
}

function ParlayPulseLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none" width="28" height="28">
      <defs>
        <linearGradient id="btn-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399"/>
          <stop offset="100%" stopColor="#10b981"/>
        </linearGradient>
        <filter id="btn-gf">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M38 36 v56 h8 v-20 h18 a18 18 0 0 0 0 -36 h-26z M46 44 h16 a10 10 0 0 1 0 20 h-16z" fill="url(#btn-g)"/>
      <polyline
        points="24,72 36,72 48,72 54,54 62,82 68,64 74,72 84,72 104,72"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#btn-gf)"
      />
      <circle cx="104" cy="72" r="3" fill="#34d399">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

export function ParlayBuilder({ selectedPicks, onRemovePick, sportFilter }: ParlayBuilderProps) {
  const { parlay, generating, error, generate } = useParlayBuilder();
  const [legs, setLegs] = useState(3);
  const [includeProps, setIncludeProps] = useState(false);

  const handleGenerate = () => generate(sportFilter ?? undefined, legs, 'safe', includeProps);

  return (
    <div className="rounded-xl bg-dk-surface border border-dk-border/50">
      <div className="px-4 py-3 border-b border-dk-border/50">
        <h3 className="text-[12px] font-semibold text-dk-textSecondary tracking-wide uppercase">Bet Slip</h3>
      </div>

      <div className="p-4 space-y-5">
        {selectedPicks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-dk-textMuted mb-2">Selected ({selectedPicks.length})</p>
            {selectedPicks.map(pick => (
              <div key={pick.id} className="flex items-center justify-between bg-dk-card rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-dk-text truncate">{pick.pick_label}</p>
                  <p className="text-[11px] text-dk-textMuted truncate">{pick.event_title}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {pick.edge != null && (
                    <span className={`text-[11px] font-mono ${Number(pick.edge) > 0 ? 'text-dk-green' : 'text-dk-red'}`}>
                      {Number(pick.edge) > 0 ? '+' : ''}{Number(pick.edge).toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[12px] font-mono font-semibold text-dk-text">{pick.odds}</span>
                  <button
                    onClick={() => onRemovePick(pick)}
                    className="text-dk-textMuted hover:text-dk-red transition-colors p-0.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-dk-textMuted">Legs</label>
              <select
                value={legs}
                onChange={e => setLegs(Number(e.target.value))}
                className="text-[12px] border border-dk-border rounded-md px-2 py-1 bg-dk-card text-dk-text"
              >
                {[2, 3, 4, 5, 6, 7].map(n => (
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

          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                width: generating ? '52px' : '100%',
                height: generating ? '52px' : '38px',
                borderRadius: generating ? '14px' : '8px',
                padding: generating ? '0' : undefined,
                transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), height 0.45s cubic-bezier(0.4,0,0.2,1), border-radius 0.45s cubic-bezier(0.4,0,0.2,1)',
              }}
              className="overflow-hidden bg-dk-green hover:bg-dk-greenLight disabled:opacity-80 flex items-center justify-center relative"
            >
              <span
                style={{
                  opacity: generating ? 0 : 1,
                  transform: generating ? 'scale(0.7)' : 'scale(1)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                  position: generating ? 'absolute' : 'relative',
                  pointerEvents: 'none',
                }}
                className="text-[12px] font-medium text-white whitespace-nowrap"
              >
                Generate Parlay
              </span>
              <span
                style={{
                  opacity: generating ? 1 : 0,
                  transform: generating ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 0.25s ease 0.2s, transform 0.25s ease 0.2s',
                  position: 'absolute',
                }}
              >
                <ParlayPulseLogo />
              </span>
            </button>
          </div>
        </div>

        {error && <p className="text-[12px] text-dk-red">{error}</p>}

        {parlay && (
          <div className="rounded-lg bg-dk-card border border-dk-green/15 overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-dk-green/10 flex items-center justify-between">
              <span className="text-[11px] text-dk-green font-medium">Best parlay</span>
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-mono font-semibold text-dk-text">{parlay.combined_odds}</span>
                <span className="text-[11px] font-mono text-dk-green">
                  {Number(parlay.confidence_avg).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="p-3.5 space-y-2">
              {parlay.combined_implied_prob != null && (
                <p className="text-[11px] text-dk-textMuted">
                  Hit probability: {Number(parlay.combined_implied_prob).toFixed(1)}%
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
