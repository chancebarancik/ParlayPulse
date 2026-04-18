import type { VercelRequest, VercelResponse } from '@vercel/node';
import { settleParlay } from './_lib/ai-analysis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { parlayId, result, legResults, actualPayout, wagerAmount } = req.body ?? {};

  if (!parlayId || !result || !legResults) {
    return res.status(400).json({
      error: 'Required: parlayId, result (win/loss/push/partial), legResults (object of pickId -> win/loss/push)',
    });
  }

  if (!['win', 'loss', 'push', 'partial'].includes(result)) {
    return res.status(400).json({ error: 'result must be win, loss, push, or partial' });
  }

  await settleParlay(parlayId, result, legResults, actualPayout, wagerAmount);
  res.json({ settled: true, parlayId, result });
}
