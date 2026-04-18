# ParlayPulse

ParlayPulse is a Vite + React + TypeScript single-page app for tracking sports parlays with server-side auth, Neon Postgres persistence, and optional bet-slip scan.

## Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- Neon Postgres
- Vercel serverless functions

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env vars:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local`:

- `POSTGRES_URL`
- `SESSION_SECRET`
- `VITE_ENABLE_SCAN=false`
- `ANTHROPIC_API_KEY` only if scan is enabled

4. Apply the database schema using [db/migrations/0001_init.sql](./db/migrations/0001_init.sql).

5. Start the full app locally:

```bash
npm run dev
```

This runs `vercel dev`, which serves both the Vite frontend and the `api/` routes on one local origin so auth and data requests work.

If you only need the frontend shell without API routes, use:

```bash
npm run dev:vite
```

## Database Setup

Run [db/migrations/0001_init.sql](./db/migrations/0001_init.sql) against your Neon or Postgres database.

That migration creates:

- `app_users`
- `parlays`
- an index on `(user_id, created_at desc)`

Auth is handled by the app's own signed session cookies.

## Environment Variables

See [.env.example](./.env.example).

Required server-side:

- `POSTGRES_URL`
- `SESSION_SECRET`

Optional frontend flag:

- `VITE_ENABLE_SCAN`

Server-only if scan is enabled:

- `ANTHROPIC_API_KEY`

Do not expose `ANTHROPIC_API_KEY` with a `VITE_` prefix.
The scan endpoint uses the same signed session cookie as the rest of the app.

## Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` runs TypeScript build checks and creates the production bundle
- `npm run preview` serves the built app locally

## Deployment

This repo is structured for Vercel:

- the frontend builds to `dist/`
- `api/scan.ts` is deployed as a serverless function
- `vercel.json` rewrites non-API routes to `index.html` for SPA routing

In Vercel, set:

- `POSTGRES_URL`
- `SESSION_SECRET`
- `VITE_ENABLE_SCAN=false` by default
- `ANTHROPIC_API_KEY` only if you explicitly enable scan

Then deploy normally.

## Scan Guardrails

- scans are disabled unless `VITE_ENABLE_SCAN=true`
- scans require a signed-in session
- only `image/png`, `image/jpeg`, and `image/webp` are accepted
- image uploads are limited to 5MB
- scan requests are throttled per user to 5 requests per minute per warm server instance

## Architecture Notes

See [docs/vercel-postgres-migration.md](./docs/vercel-postgres-migration.md) for the current server-side architecture notes.

## Verification

Verified locally:

- `npm install`
- `npm run build`
- `npm run dev`
