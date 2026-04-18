# Vercel-Native Architecture Notes

This app no longer uses Supabase. The current stack is:

- Neon Postgres for storage
- Vercel serverless routes for auth, parlays, and optional scan
- signed HttpOnly cookie sessions issued by the app

## Current Shape

- The Vite frontend calls `/api/auth/*`, `/api/parlays`, and `/api/scan`
- Database access is server-side only
- Session auth is enforced in route handlers
- Scan remains optional and server-side only

## Tradeoffs

Why this shape is better aligned with Vercel:

- no browser-direct database access
- no hosted auth vendor dependency
- data and authorization logic live in first-party server code

What you take on:

- more backend code to maintain
- your own password and session handling
- no database-level RLS safety net

## Key Files

- `api/_lib/db.ts`
- `api/_lib/auth.ts`
- `api/auth/me.ts`
- `api/auth/signin.ts`
- `api/auth/signup.ts`
- `api/auth/signout.ts`
- `api/parlays.ts`
- `db/migrations/0001_init.sql`
