create table if not exists app_users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists parlays (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  book text not null,
  sport text not null,
  wager numeric(12,2) not null check (wager >= 0),
  payout numeric(12,2) not null check (payout >= 0),
  odds text,
  status text not null check (status in ('pending', 'win', 'loss')),
  legs text[] not null,
  scanned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists parlays_user_id_created_at_idx
  on parlays (user_id, created_at desc);
