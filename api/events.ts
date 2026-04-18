import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncEvents, getCachedEvents, type Sport, SPORTS } from './_lib/sports-data.js';
import { getPicksForEvent } from './_lib/ai-analysis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { sport, id, refresh } = req.query;

    if (id && typeof id === 'string') {
      const picks = await getPicksForEvent(id);
      return res.json({ picks });
    }

    const sportFilter = typeof sport === 'string' && SPORTS.includes(sport as Sport)
      ? sport as Sport
      : undefined;

    if (refresh === 'true') {
      const sports = sportFilter ? [sportFilter] : SPORTS;
      const results = await Promise.all(sports.map(s => syncEvents(s)));
      return res.json({ events: results.flat(), synced: true });
    }

    const events = await getCachedEvents(sportFilter);
    return res.json({ events });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
