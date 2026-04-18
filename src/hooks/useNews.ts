import { useState, useEffect, useCallback } from 'react';
import type { Sport } from '../lib/types';

export interface NewsItem {
  title: string;
  summary: string;
  sport: string;
  type: string;
  published: string;
  image?: string;
  url?: string;
}

export function useNews(sport?: Sport) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = sport ? `?sport=${sport}` : '';
      const res = await fetch(`/api/news${params}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [sport]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { news, loading, refresh: fetch_ };
}
