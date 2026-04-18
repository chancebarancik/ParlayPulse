import { useState, useEffect, useCallback } from 'react';
import type { SportEvent, Sport } from '../lib/types';

export function useEvents(sport?: Sport) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sport) params.set('sport', sport);
      if (refresh) params.set('refresh', 'true');
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { events, loading, error, refresh: () => fetch_(true) };
}
