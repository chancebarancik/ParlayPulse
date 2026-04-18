import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSessionUser } from './_lib/auth.js';

const SYSTEM_PROMPT =
  'Extract this sports bet slip into JSON only. No markdown, no explanation. ' +
  'Format: {"book":"","sport":"","wager":0,"payout":0,"odds":"","legs":["leg description..."]}. ' +
  'book must be one of: DraftKings, FanDuel, BetMGM, ESPN Bet, Caesars, PointsBet, Other. ' +
  'sport must be one of: NBA, NFL, MLB, NHL, Soccer, NCAAB, UFC, Mixed. ' +
  'wager and payout as numbers. odds as string like +450 or -110. ' +
  'legs as short readable strings. If any field is unknown use empty string or 0.';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const userScanHistory = new Map<string, number[]>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (process.env.VITE_ENABLE_SCAN !== 'true') {
    res.status(404).json({ error: 'Bet-slip scanning is disabled' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Bet-slip scanning is not configured on the server' });
    return;
  }

  const user = requireSessionUser(req, res);
  if (!user) return;

  const now = Date.now();
  const recentRequests = (userScanHistory.get(user.id) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many scan requests. Try again in a minute.' });
    return;
  }
  recentRequests.push(now);
  userScanHistory.set(user.id, recentRequests);

  const { image, mime } = (req.body ?? {}) as { image?: string; mime?: string };
  if (!image || !mime) {
    res.status(400).json({ error: 'Body must include { image, mime }' });
    return;
  }
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    res.status(400).json({ error: 'Only PNG, JPEG, and WebP images are supported' });
    return;
  }
  const imageBytes = Buffer.from(image, 'base64').byteLength;
  if (imageBytes > MAX_IMAGE_BYTES) {
    res.status(413).json({ error: 'Image must be 5MB or smaller' });
    return;
  }

  let claudeResp: Response;
  try {
    claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mime, data: image },
              },
              {
                type: 'text',
                text: SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' },
              },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    res.status(502).json({
      error: 'Failed to reach Anthropic API',
      detail: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  if (!claudeResp.ok) {
    const detail = await claudeResp.text();
    res.status(502).json({ error: 'Anthropic API error', detail });
    return;
  }

  const data = (await claudeResp.json()) as {
    content: { type: string; text?: string }[];
  };
  const text = data.content.map((c) => c.text ?? '').join('');
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    res.status(200).json(JSON.parse(cleaned));
  } catch {
    res.status(502).json({ error: 'Failed to parse model response', raw: text });
  }
}
