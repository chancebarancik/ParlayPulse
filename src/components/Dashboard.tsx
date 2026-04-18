import { useState, useCallback } from 'react';
import type { Pick, Sport } from '../lib/types';
import { SPORTS } from '../lib/types';
import { usePicks } from '../hooks/usePicks';
import { useEvents } from '../hooks/useEvents';
import { SportFilter } from './SportFilter';
import { PickCard } from './PickCard';
import { EventCard } from './EventCard';
import { ParlayBuilder } from './ParlayBuilder';

export function Dashboard() {
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);
  const { picks, loading: picksLoading, analyzeSport } = usePicks(sportFilter ?? undefined);
  const { events, refresh: refreshEvents } = useEvents(sportFilter ?? undefined);
  const [selectedPicks, setSelectedPicks] = useState<Pick[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [includeProps, setIncludeProps] = useState(false);

  const togglePick = useCallback((pick: Pick) => {
    setSelectedPicks(prev =>
      prev.some(p => p.id === pick.id)
        ? prev.filter(p => p.id !== pick.id)
        : [...prev, pick]
    );
  }, []);

  const removePick = useCallback((pick: Pick) => {
    setSelectedPicks(prev => prev.filter(p => p.id !== pick.id));
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await refreshEvents();
    if (sportFilter) {
      await analyzeSport(sportFilter, includeProps);
    } else {
      for (const s of SPORTS) {
        await analyzeSport(s, includeProps);
      }
    }
    setAnalyzing(false);
  };

  const analyzeLabel = sportFilter
    ? `Analyze ${sportFilter}`
    : 'Analyze All Sports';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SportFilter active={sportFilter} onChange={setSportFilter} />
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={includeProps}
            onChange={e => setIncludeProps(e.target.checked)}
            className="rounded border-dk-border text-dk-green bg-dk-card w-3 h-3"
          />
          <span className="text-[11px] text-dk-textMuted">Include props</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-dk-text">ParlayPulse Picks</h2>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="text-[11px] px-3.5 py-1.5 rounded-md bg-dk-accent/10 text-dk-accent font-medium hover:bg-dk-accent/20 disabled:opacity-40 transition-all"
            >
              {analyzing ? 'Analyzing...' : analyzeLabel}
            </button>
          </div>

          {picksLoading && picks.length === 0 ? (
            <div className="text-center py-16 text-dk-textMuted text-[12px]">Loading picks...</div>
          ) : picks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-dk-textSecondary text-[13px] mb-1">No picks yet</p>
              <p className="text-dk-textMuted text-[11px]">
                Select a sport and analyze to generate picks
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {picks.map(pick => (
                <PickCard
                  key={pick.id}
                  pick={pick}
                  selected={selectedPicks.some(p => p.id === pick.id)}
                  onToggle={togglePick}
                />
              ))}
            </div>
          )}

          {events.length > 0 && (
            <div className="pt-2">
              <h2 className="text-sm font-semibold text-dk-text mb-3">Upcoming Events</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {events.slice(0, 10).map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <ParlayBuilder
            selectedPicks={selectedPicks}
            onRemovePick={removePick}
            sportFilter={sportFilter}
          />
        </div>
      </div>
    </div>
  );
}
