import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPerformanceStats, getParlayHistory } from './_lib/ai-analysis';
import type { Sport } from './_lib/sports-data';
import { SPORTS } from './_lib/sports-data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sport, history } = req.query;
  const sportFilter = typeof sport === 'string' && SPORTS.includes(sport as Sport)
    ? sport as Sport
    : undefined;

  if (history === 'true') {
    const parlays = await getParlayHistory();
    return res.json({ parlays });
  }

  const stats = await getPerformanceStats(sportFilter);
  res.json(stats);
}
