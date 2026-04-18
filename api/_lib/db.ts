import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? '';

if (!databaseUrl) {
  throw new Error('Missing POSTGRES_URL or DATABASE_URL');
}

export const sql = neon(databaseUrl);
