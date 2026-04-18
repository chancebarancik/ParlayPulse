import { useCallback, useEffect, useState } from 'react';
import type { NewParlay, Parlay } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export function useParlays() {
  const { user } = useAuth();
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setParlays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const resp = await fetch('/api/parlays', { credentials: 'same-origin' });
    const data = (await resp.json().catch(() => null)) as
      | { parlays?: Parlay[]; error?: string }
      | null;
    if (!resp.ok) {
      setError(data?.error ?? 'Failed to load parlays');
      setParlays([]);
    } else {
      setError(null);
      setParlays(data?.parlays ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (input: NewParlay) => {
      if (!user) throw new Error('Not signed in');
      const resp = await fetch('/api/parlays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(input),
      });
      const data = (await resp.json().catch(() => null)) as
        | { parlay?: Parlay; error?: string }
        | null;
      if (!resp.ok || !data?.parlay) {
        throw new Error(data?.error ?? 'Failed to save parlay');
      }
      const parlay = data.parlay;
      setParlays((prev) => [parlay, ...prev]);
    },
    [user],
  );

  const update = useCallback(
    async (id: string, input: NewParlay) => {
      if (!user) throw new Error('Not signed in');
      const resp = await fetch(`/api/parlays?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(input),
      });
      const data = (await resp.json().catch(() => null)) as
        | { parlay?: Parlay; error?: string }
        | null;
      if (!resp.ok || !data?.parlay) {
        throw new Error(data?.error ?? 'Failed to update parlay');
      }
      const updated = data.parlay;
      setParlays((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not signed in');
      const prev = parlays;
      setParlays((curr) => curr.filter((p) => p.id !== id));
      const resp = await fetch(`/api/parlays?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!resp.ok) {
        setParlays(prev);
        const data = (await resp.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Failed to delete parlay');
      }
    },
    [user, parlays],
  );

  return { parlays, loading, error, create, update, remove, reload };
}
