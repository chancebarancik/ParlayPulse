import { useState, useEffect, useCallback } from 'react';
import type { Pick, Sport, Strategy, GeneratedParlay, PerformanceStats } from '../lib/types';

export function usePicks(sport?: Sport) {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPicks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = sport ? `?sport=${sport}` : '';
      const res = await fetch(`/api/picks${params}`);
      if (!res.ok) throw new Error('Failed to fetch picks');
      const data = await res.json();
      setPicks(data.picks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => { fetchPicks(); }, [fetchPicks]);

  const analyzeSport = useCallback(async (s: Sport, includeProps = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: s, includeProps }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setPicks(data.picks);
      return data;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { picks, loading, error, refresh: fetchPicks, analyzeSport };
}

export function useParlayBuilder() {
  const [generating, setGenerating] = useState(false);
  const [parlay, setParlay] = useState<GeneratedParlay | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    sport?: Sport,
    legs = 3,
    strategy: Strategy = 'balanced',
    includeProps = false
  ) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-parlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, legs, strategy, includeProps }),
      });
      if (!res.ok) throw new Error('Failed to generate parlay');
      const data = await res.json();
      setParlay(data.parlay);
      return data.parlay;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { parlay, generating, error, generate };
}

export function usePerformance() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [history, setHistory] = useState<GeneratedParlay[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (sport?: Sport) => {
    setLoading(true);
    try {
      const params = sport ? `?sport=${sport}` : '';
      const res = await fetch(`/api/performance${params}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      setStats(await res.json());
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/performance?history=true');
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data.parlays);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const settle = useCallback(async (
    parlayId: string,
    result: 'win' | 'loss' | 'push' | 'partial',
    legResults: Record<string, 'win' | 'loss' | 'push'>,
    actualPayout?: number,
    wagerAmount?: number
  ) => {
    const res = await fetch('/api/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parlayId, result, legResults, actualPayout, wagerAmount }),
    });
    if (!res.ok) throw new Error('Failed to settle');
    await fetchStats();
    await fetchHistory();
  }, [fetchStats, fetchHistory]);

  return { stats, history, loading, fetchStats, fetchHistory, settle };
}
