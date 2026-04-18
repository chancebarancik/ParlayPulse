import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTopPicks, analyzeEvent } from './_lib/ai-analysis.js';
import { syncEvents, type Sport, SPORTS } from './_lib/sports-data.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { sport, category } = req.query;
    const sportFilter = typeof sport === 'string' && SPORTS.includes(sport as Sport)
      ? sport as Sport
      : undefined;
    const categoryFilter = typeof category === 'string' ? category : undefined;

    const picks = await getTopPicks(sportFilter, categoryFilter);
    return res.json({ picks });
  }

  if (req.method === 'POST') {
    const { sport, includeProps } = req.body ?? {};
    if (!sport || !SPORTS.includes(sport)) {
      return res.status(400).json({ error: 'sport must be UFC, MLB, or NFL' });
    }

    const events = await syncEvents(sport);
    const allPicks = [];
    for (const event of events.slice(0, 5)) {
      const picks = await analyzeEvent(event, includeProps === true);
      allPicks.push(...picks.map(p => ({ ...p, event_title: event.title })));
    }

    return res.json({ picks: allPicks, events_analyzed: events.length });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
