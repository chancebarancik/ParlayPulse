-- Events: upcoming games/fights across UFC, MLB, NFL
create table if not exists events (
  id text primary key,
  sport text not null check (sport in ('UFC', 'MLB', 'NFL')),
  title text not null,
  commence_time timestamptz not null,
  home_team text,
  away_team text,
  venue text,
  odds_data jsonb,
  stats_data jsonb,
  injuries_data jsonb,
  weather_data jsonb,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists events_sport_commence_idx
  on events (sport, commence_time);

-- AI-generated picks (expanded with category + risk tier)
create table if not exists picks (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  sport text not null,
  pick_type text not null,
  pick_category text not null default 'game',
  pick_label text not null,
  confidence numeric(5,2) not null check (confidence between 0 and 100),
  implied_probability numeric(5,2),
  edge numeric(5,2),
  odds text,
  reasoning text not null,
  factors jsonb,
  created_at timestamptz not null default now()
);

create index if not exists picks_event_id_idx on picks (event_id);
create index if not exists picks_confidence_idx on picks (confidence desc);
create index if not exists picks_category_idx on picks (pick_category);

-- Generated parlays with strategy type and outcome tracking
create table if not exists generated_parlays (
  id text primary key,
  strategy text not null default 'balanced',
  sport_filter text,
  pick_ids text[] not null,
  pick_details jsonb not null default '[]',
  combined_odds text,
  combined_implied_prob numeric(8,4),
  confidence_avg numeric(5,2),
  reasoning text,
  result text check (result in ('pending', 'win', 'loss', 'push', 'partial')),
  actual_payout numeric(12,2),
  wager_amount numeric(12,2),
  settled_at timestamptz,
  leg_results jsonb,
  created_at timestamptz not null default now()
);

create index if not exists generated_parlays_created_idx
  on generated_parlays (created_at desc);
create index if not exists generated_parlays_result_idx
  on generated_parlays (result);
create index if not exists generated_parlays_strategy_idx
  on generated_parlays (strategy);

-- Performance tracking: aggregated stats per pick type, sport, strategy
create table if not exists performance_log (
  id text primary key,
  pick_id text references picks(id) on delete set null,
  parlay_id text references generated_parlays(id) on delete set null,
  sport text not null,
  pick_type text not null,
  pick_category text not null,
  strategy text,
  confidence_at_pick numeric(5,2),
  odds_at_pick text,
  result text not null check (result in ('win', 'loss', 'push')),
  created_at timestamptz not null default now()
);

create index if not exists perf_log_sport_type_idx
  on performance_log (sport, pick_type);
create index if not exists perf_log_category_idx
  on performance_log (pick_category, result);

-- Learning insights: AI-derived patterns from historical performance
create table if not exists learning_insights (
  id text primary key,
  sport text,
  pick_type text,
  pick_category text,
  strategy text,
  insight text not null,
  sample_size integer not null,
  win_rate numeric(5,2),
  avg_confidence numeric(5,2),
  avg_edge numeric(5,2),
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_sport_idx
  on learning_insights (sport, pick_type);
