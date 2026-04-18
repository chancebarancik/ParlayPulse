import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  hashPassword,
  newId,
  normalizeEmail,
  setSessionCookie,
  validateCredentials,
} from '../_lib/auth.js';
import { sql } from '../_lib/db.js';

interface ExistingUserRow {
  id: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email = '', password = '' } = (req.body ?? {}) as {
    email?: string;
    password?: string;
  };

  const validationError = validateCredentials(email, password);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = (await sql`
    select id
    from app_users
    where email = ${normalizedEmail}
    limit 1
  `) as ExistingUserRow[];
  if (existing.length) {
    res.status(409).json({ error: 'An account with that email already exists.' });
    return;
  }

  const id = newId();
  const passwordHash = hashPassword(password);
  await sql`
    insert into app_users (id, email, password_hash)
    values (${id}, ${normalizedEmail}, ${passwordHash})
  `;

  setSessionCookie(res, { id, email: normalizedEmail });
  res.status(201).json({
    user: { id, email: normalizedEmail },
    needsEmailConfirmation: false,
  });
}
