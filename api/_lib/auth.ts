import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface SessionUser {
  id: string;
  email: string;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

const SESSION_COOKIE = 'parlaypulse_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing SESSION_SECRET');
  }
  return secret;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url');
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest();
}

function parseCookies(header?: string) {
  if (!header) return new Map<string, string>();
  return new Map(
    header
      .split(';')
      .map((part) => part.trim())
      .map((part) => {
        const idx = part.indexOf('=');
        return idx === -1 ? [part, ''] : [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      }),
  );
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, storedHash] = passwordHash.split(':');
  if (scheme !== 'scrypt' || !salt || !storedHash) return false;
  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, 'hex');
  return derived.length === stored.length && timingSafeEqual(derived, stored);
}

export function setSessionCookie(res: VercelResponse, user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = toBase64Url(sign(encodedPayload));
  const token = `${encodedPayload}.${signature}`;
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secureFlag}`,
  );
}

export function clearSessionCookie(res: VercelResponse) {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
  );
}

export function getSessionUser(req: VercelRequest): SessionUser | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;
  const [encodedPayload, encodedSignature] = token.split('.');
  if (!encodedPayload || !encodedSignature) return null;
  const expected = sign(encodedPayload);
  const provided = fromBase64Url(encodedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }
  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

export function requireSessionUser(req: VercelRequest, res: VercelResponse) {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return user;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateCredentials(email: string, password: string) {
  if (!email.includes('@')) return 'Enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export function newId() {
  return randomUUID();
}
