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
  const [picksOpen, setPicksOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);

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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SportFilter active={sportFilter} onChange={setSportFilter} />
      </div>

      <ParlayBuilder
        selectedPicks={selectedPicks}
        onRemovePick={removePick}
        sportFilter={sportFilter}
      />

      {picks.length > 0 && (
        <div className="rounded-lg bg-dk-surface border border-dk-border/50 overflow-hidden">
          <button
            onClick={() => setPicksOpen(prev => !prev)}
            className="flex items-center gap-2 w-full text-left px-4 py-3"
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              className={`text-dk-textMuted transition-transform ${picksOpen ? 'rotate-90' : ''}`}
            >
              <path d="M2 1l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[12px] font-semibold text-dk-text">ParlayPulse Picks</span>
            <span className="text-[10px] text-dk-textMuted ml-auto">{picks.length}</span>
          </button>
          {picksOpen && (
            <div className="px-3 pb-3 space-y-1">
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
        </div>
      )}

      {picksLoading && picks.length === 0 && (
        <div className="text-center py-8 text-dk-textMuted text-[12px]">Loading picks...</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-dk-surface border border-dk-border/50 overflow-hidden">
          <button
            onClick={() => setEventsOpen(prev => !prev)}
            className="flex items-center gap-2 w-full text-left px-4 py-3"
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              className={`text-dk-textMuted transition-transform ${eventsOpen ? 'rotate-90' : ''}`}
            >
              <path d="M2 1l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[12px] font-semibold text-dk-text">Upcoming Events</span>
            {events.length > 0 && (
              <span className="text-[10px] text-dk-textMuted ml-auto">{events.length}</span>
            )}
          </button>
          {eventsOpen && events.length > 0 && (
            <div className="px-3 pb-3 space-y-1">
              {events.slice(0, 10).map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-dk-surface border border-dk-border/50 overflow-hidden">
          <button
            onClick={() => setNewsOpen(prev => !prev)}
            className="flex items-center gap-2 w-full text-left px-4 py-3"
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              className={`text-dk-textMuted transition-transform ${newsOpen ? 'rotate-90' : ''}`}
            >
              <path d="M2 1l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[12px] font-semibold text-dk-text">Sports Intel</span>
            {news.length > 0 && (
              <span className="text-[10px] text-dk-textMuted ml-auto">{news.length}</span>
            )}
          </button>
          {newsOpen && (
            <div className="px-3 pb-3">
              <NewsFeed news={news} loading={newsLoading} inline />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
