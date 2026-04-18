import { useState, useCallback } from 'react';
import type { Pick, Sport } from '../lib/types';
import { usePicks } from '../hooks/usePicks';
import { useEvents } from '../hooks/useEvents';
import { useNews } from '../hooks/useNews';
import { SportFilter } from './SportFilter';
import { PickCard } from './PickCard';
import { EventCard } from './EventCard';
import { ParlayBuilder } from './ParlayBuilder';
import { NewsFeed } from './NewsFeed';

export function Dashboard() {
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);
  const { picks, loading: picksLoading } = usePicks(sportFilter ?? undefined);
  const { events } = useEvents(sportFilter ?? undefined);
  const { news, loading: newsLoading } = useNews(sportFilter ?? undefined);
  const [selectedPicks, setSelectedPicks] = useState<Pick[]>([]);
  const [includeProps, setIncludeProps] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

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
          <ParlayBuilder
            selectedPicks={selectedPicks}
            onRemovePick={removePick}
            sportFilter={sportFilter}
          />

          {picks.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-dk-text">ParlayPulse Picks</h2>
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
            </>
          )}

          {picksLoading && picks.length === 0 && (
            <div className="text-center py-8 text-dk-textMuted text-[12px]">Loading picks...</div>
          )}

          {events.length > 0 && (
            <div>
              <button
                onClick={() => setEventsOpen(prev => !prev)}
                className="flex items-center gap-2 w-full text-left py-2"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`text-dk-textMuted transition-transform ${eventsOpen ? 'rotate-90' : ''}`}
                >
                  <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-semibold text-dk-text">Upcoming Events</span>
                <span className="text-[11px] text-dk-textMuted">{events.length}</span>
              </button>
              {eventsOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                  {events.slice(0, 10).map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          <NewsFeed news={news} loading={newsLoading} />
        </div>

        <div className="lg:col-span-1 hidden lg:block" />
      </div>
    </div>
  );
}
