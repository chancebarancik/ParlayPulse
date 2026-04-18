import type { VercelRequest, VercelResponse } from '@vercel/node';
import { newId, requireSessionUser } from './_lib/auth.js';
import { sql } from './_lib/db.js';

interface ParlayRow {
  id: string;
  user_id: string;
  book: string;
  sport: string;
  wager: string | number;
  payout: string | number;
  odds: string | null;
  status: 'pending' | 'win' | 'loss';
  legs: string[];
  scanned: boolean;
  created_at: string;
}

function serializeParlay(row: ParlayRow) {
  return {
    ...row,
    wager: Number(row.wager),
    payout: Number(row.payout),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const rows = (await sql`
      select id, user_id, book, sport, wager, payout, odds, status, legs, scanned, created_at
      from parlays
      where user_id = ${user.id}
      order by created_at desc
    `) as ParlayRow[];
    res.status(200).json({ parlays: rows.map(serializeParlay) });
    return;
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as ParlayInput;
    const validation = validateParlayInput(body);
    if ('error' in validation) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const id = newId();
    const { book, sport, wager, payout, odds, status, legs, scanned } = validation;
    const rows = (await sql`
      insert into parlays (
        id,
        user_id,
        book,
        sport,
        wager,
        payout,
        odds,
        status,
        legs,
        scanned
      )
      values (
        ${id},
        ${user.id},
        ${book},
        ${sport},
        ${wager},
        ${payout},
        ${odds},
        ${status},
        ${legs},
        ${scanned}
      )
      returning id, user_id, book, sport, wager, payout, odds, status, legs, scanned, created_at
    `) as ParlayRow[];

    res.status(201).json({ parlay: serializeParlay(rows[0]) });
    return;
  }

  const parlayId = typeof req.query.id === 'string' ? req.query.id : null;

  if (req.method === 'PATCH') {
    if (!parlayId) {
      res.status(400).json({ error: 'Missing parlay id' });
      return;
    }
    const body = (req.body ?? {}) as ParlayInput;
    const validation = validateParlayInput(body);
    if ('error' in validation) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const { book, sport, wager, payout, odds, status, legs, scanned } = validation;
    const rows = (await sql`
      update parlays set
        book = ${book},
        sport = ${sport},
        wager = ${wager},
        payout = ${payout},
        odds = ${odds},
        status = ${status},
        legs = ${legs},
        scanned = ${scanned}
      where id = ${parlayId} and user_id = ${user.id}
      returning id, user_id, book, sport, wager, payout, odds, status, legs, scanned, created_at
    `) as ParlayRow[];
    if (!rows.length) {
      res.status(404).json({ error: 'Parlay not found' });
      return;
    }
    res.status(200).json({ parlay: serializeParlay(rows[0]) });
    return;
  }

  if (req.method === 'DELETE') {
    if (!parlayId) {
      res.status(400).json({ error: 'Missing parlay id' });
      return;
    }
    const rows = (await sql`
      delete from parlays
      where id = ${parlayId} and user_id = ${user.id}
      returning id
    `) as { id: string }[];
    if (!rows.length) {
      res.status(404).json({ error: 'Parlay not found' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

interface ParlayInput {
  book?: string;
  sport?: string;
  wager?: number;
  payout?: number;
  odds?: string | null;
  status?: 'pending' | 'win' | 'loss';
  legs?: string[];
  scanned?: boolean;
}

interface ValidatedParlay {
  book: string;
  sport: string;
  wager: number;
  payout: number;
  odds: string | null;
  status: 'pending' | 'win' | 'loss';
  legs: string[];
  scanned: boolean;
}

function validateParlayInput(body: ParlayInput): ValidatedParlay | { error: string } {
  const legs = (body.legs ?? []).map((leg) => leg.trim()).filter(Boolean);
  if (!legs.length) return { error: 'Add at least one leg.' };

  const status = body.status ?? 'pending';
  if (!['pending', 'win', 'loss'].includes(status)) {
    return { error: 'Invalid parlay status.' };
  }

  const wager = Number(body.wager ?? 0);
  const payout = Number(body.payout ?? 0);
  if (!Number.isFinite(wager) || wager < 0) return { error: 'Invalid wager.' };
  if (!Number.isFinite(payout) || payout < 0) return { error: 'Invalid payout.' };

  return {
    book: body.book?.trim() || 'Other',
    sport: body.sport?.trim() || 'Mixed',
    wager,
    payout,
    odds: body.odds?.trim() || null,
    status,
    legs,
    scanned: Boolean(body.scanned),
  };
}
