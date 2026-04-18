import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateParlay, type Strategy } from './_lib/ai-analysis';
import type { Sport } from './_lib/sports-data';
import { SPORTS } from './_lib/sports-data';

const STRATEGIES: Strategy[] = ['safe', 'balanced', 'aggressive'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sport, legs, strategy, includeProps } = req.body ?? {};

  const sportFilter = typeof sport === 'string' && SPORTS.includes(sport as Sport)
    ? sport as Sport
    : undefined;
  const legCount = typeof legs === 'number' && legs >= 2 && legs <= 10 ? legs : 3;
  const strat: Strategy = typeof strategy === 'string' && STRATEGIES.includes(strategy as Strategy)
    ? strategy as Strategy
    : 'balanced';
  const props = includeProps === true;

  const parlay = await generateParlay(sportFilter, legCount, strat, props);
  res.json({ parlay });
}
