import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizeEmail, setSessionCookie, validateCredentials, verifyPassword } from '../_lib/auth.js';
import { sql } from '../_lib/db.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
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
  const rows = (await sql`
    select id, email, password_hash
    from app_users
    where email = ${normalizedEmail}
    limit 1
  `) as UserRow[];
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  setSessionCookie(res, { id: user.id, email: user.email });
  res.status(200).json({ user: { id: user.id, email: user.email } });
}
