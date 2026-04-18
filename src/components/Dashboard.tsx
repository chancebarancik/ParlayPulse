import { useState, useCallback } from 'react';
import type { Pick, Sport } from '../lib/types';
import { usePicks } from '../hooks/usePicks';
import { useEvents } from '../hooks/useEvents';
import { SportFilter } from './SportFilter';
import { PickCard } from './PickCard';
import { EventCard } from './EventCard';
import { ParlayBuilder } from './ParlayBuilder';

export function Dashboard() {
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);
  const { picks, loading: picksLoading, analyzeSport } = usePicks(sportFilter ?? undefined);
  const { events, loading: eventsLoading, refresh: refreshEvents } = useEvents(sportFilter ?? undefined);
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

  const handleAnalyze = async (sport: Sport) => {
    setAnalyzing(true);
    await refreshEvents();
    await analyzeSport(sport, includeProps);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SportFilter active={sportFilter} onChange={setSportFilter} />
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={includeProps}
            onChange={e => setIncludeProps(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
          />
          <span className="text-xs text-gray-600">Include Props in Analysis</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-gray-900">AI Picks</h2>
            <div className="flex gap-2">
              {(['UFC', 'MLB', 'NFL'] as Sport[]).map(s => (
                <button
                  key={s}
                  onClick={() => handleAnalyze(s)}
                  disabled={analyzing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {analyzing ? '...' : `Analyze ${s}`}
                </button>
              ))}
            </div>
          </div>

          {picksLoading && picks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading picks...</div>
          ) : picks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500 text-sm mb-2">No picks yet</p>
              <p className="text-gray-400 text-xs">
                Click "Analyze" for a sport to generate AI picks from live data
              </p>
            </div>
          ) : (
            <div className="space-y-2">
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
            <>
              <h2 className="font-bold text-gray-900 mt-6">Upcoming Events</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {events.slice(0, 10).map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
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
