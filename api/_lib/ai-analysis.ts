import { sql } from './db.js';
import { syncEvents, type EnrichedEvent, type Sport, SPORTS } from './sports-data.js';

export type Strategy = 'safe' | 'balanced' | 'aggressive';

interface AnalyzedPick {
  pick_type: string;
  pick_category: 'game' | 'player_prop' | 'team_prop' | 'method' | 'round' | 'inning';
  pick_label: string;
  confidence: number;
  implied_probability: number;
  edge: number;
  odds: string | null;
  reasoning: string;
  factors: Record<string, unknown>;
}

// --- Math utilities ---

function americanToImplied(odds: number): number {
  if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100) * 100;
  return 100 / (odds + 100) * 100;
}

function impliedToAmerican(prob: number): string {
  if (prob >= 50) {
    const odds = Math.round(-prob / (1 - prob / 100));
    return String(odds);
  }
  const odds = Math.round((100 / (prob / 100)) - 100);
  return `+${odds}`;
}

function parseRecord(record: string | null): { wins: number; losses: number; pct: number } | null {
  if (!record) return null;
  const m = record.match(/(\d+)-(\d+)/);
  if (!m) return null;
  const wins = parseInt(m[1]);
  const losses = parseInt(m[2]);
  const total = wins + losses;
  return { wins, losses, pct: total > 0 ? wins / total : 0.5 };
}

function parseMoneyline(oddsData: Record<string, unknown> | null): { home: number; away: number } | null {
  if (!oddsData) return null;
  const ml = oddsData.moneyline as Record<string, unknown> | undefined;
  if (!ml) return null;
  const home = ml.home as Record<string, unknown> | undefined;
  const away = ml.away as Record<string, unknown> | undefined;
  const homeClose = home?.close as Record<string, unknown> | undefined;
  const awayClose = away?.close as Record<string, unknown> | undefined;
  const homeOdds = parseFloat(String(homeClose?.odds ?? '0'));
  const awayOdds = parseFloat(String(awayClose?.odds ?? '0'));
  if (!homeOdds || !awayOdds) return null;
  return { home: homeOdds, away: awayOdds };
}

// --- Statistical analysis engine ---

function analyzeMoneyline(event: EnrichedEvent): AnalyzedPick[] {
  const picks: AnalyzedPick[] = [];
  const odds = event.odds_data as Record<string, unknown> | null;
  const ml = parseMoneyline(odds);
  if (!ml || !event.home_team || !event.away_team) return picks;

  const homeImplied = americanToImplied(ml.home);
  const awayImplied = americanToImplied(ml.away);

  const homeRec = parseRecord(event.home_record);
  const awayRec = parseRecord(event.away_record);

  // Home advantage factor
  const homeAdvantage = event.sport === 'NFL' ? 3.0 : event.sport === 'MLB' ? 2.0 : 0;

  // Record-based adjustment
  let recordAdj = 0;
  if (homeRec && awayRec) {
    recordAdj = (homeRec.pct - awayRec.pct) * 15;
  }

  // Injury impact
  const homeInjuries = event.injuries.filter(i =>
    i.team.toLowerCase().includes(event.home_team!.toLowerCase().split(' ').pop()!)
  );
  const awayInjuries = event.injuries.filter(i =>
    i.team.toLowerCase().includes(event.away_team!.toLowerCase().split(' ').pop()!)
  );
  const injuryAdj = (awayInjuries.length - homeInjuries.length) * 1.5;

  // Weather impact (outdoor sports)
  let weatherAdj = 0;
  let weatherNote = '';
  if (event.weather && !event.indoor) {
    if (event.weather.temperature < 35) {
      weatherAdj = -2;
      weatherNote = 'Cold weather may affect play. ';
    }
    if (event.weather.condition.toLowerCase().includes('rain')) {
      weatherNote += 'Rain expected — favors unders. ';
    }
    if (event.weather.condition.toLowerCase().includes('wind')) {
      weatherNote += 'Windy conditions. ';
    }
  }

  const homeConfidence = Math.min(95, Math.max(15, homeImplied + homeAdvantage + recordAdj + injuryAdj + weatherAdj));
  const awayConfidence = Math.min(95, Math.max(15, awayImplied - homeAdvantage - recordAdj - injuryAdj - weatherAdj));

  const homeEdge = homeConfidence - homeImplied;
  const awayEdge = awayConfidence - awayImplied;

  const factors: Record<string, unknown> = {
    home_advantage: homeAdvantage,
    record_adjustment: recordAdj,
    injury_impact: injuryAdj,
    weather_impact: weatherAdj,
  };

  // Home moneyline
  const homeReasons: string[] = [];
  if (homeRec) homeReasons.push(`${event.home_team} is ${homeRec.wins}-${homeRec.losses}`);
  if (homeAdvantage > 0) homeReasons.push('home field advantage');
  if (homeInjuries.length > 0) homeReasons.push(`${homeInjuries.length} injuries on roster`);
  if (awayInjuries.length > 0) homeReasons.push(`opponent has ${awayInjuries.length} injuries`);
  if (weatherNote) homeReasons.push(weatherNote.trim());

  picks.push({
    pick_type: 'moneyline',
    pick_category: 'game',
    pick_label: `${event.home_team} ML`,
    confidence: Math.round(homeConfidence * 10) / 10,
    implied_probability: Math.round(homeImplied * 10) / 10,
    edge: Math.round(homeEdge * 10) / 10,
    odds: String(ml.home),
    reasoning: homeReasons.join('. ') + '.',
    factors,
  });

  // Away moneyline
  const awayReasons: string[] = [];
  if (awayRec) awayReasons.push(`${event.away_team} is ${awayRec.wins}-${awayRec.losses}`);
  if (awayInjuries.length === 0) awayReasons.push('healthy roster');
  if (homeInjuries.length > 0) awayReasons.push(`${event.home_team} has ${homeInjuries.length} injuries`);

  picks.push({
    pick_type: 'moneyline',
    pick_category: 'game',
    pick_label: `${event.away_team} ML`,
    confidence: Math.round(awayConfidence * 10) / 10,
    implied_probability: Math.round(awayImplied * 10) / 10,
    edge: Math.round(awayEdge * 10) / 10,
    odds: String(ml.away),
    reasoning: awayReasons.join('. ') + '.',
    factors,
  });

  return picks;
}

function analyzeSpread(event: EnrichedEvent): AnalyzedPick[] {
  const picks: AnalyzedPick[] = [];
  const odds = event.odds_data as Record<string, unknown> | null;
  if (!odds || !event.home_team || !event.away_team) return picks;

  const spread = odds.spread as number | undefined;
  const details = odds.details as string | undefined;
  if (spread == null || !details) return picks;

  const homeRec = parseRecord(event.home_record);
  const awayRec = parseRecord(event.away_record);

  // Stronger team covering logic
  let coverProb = 50;
  if (homeRec && awayRec) {
    const diff = homeRec.pct - awayRec.pct;
    coverProb += diff * 20;
  }

  // Key numbers for NFL
  if (event.sport === 'NFL') {
    if (Math.abs(spread) === 3) coverProb += spread < 0 ? 2 : -2;
    if (Math.abs(spread) === 7) coverProb += spread < 0 ? 1.5 : -1.5;
  }

  const impliedProb = 52.4; // standard -110 juice
  const edge = coverProb - impliedProb;

  picks.push({
    pick_type: 'spread',
    pick_category: 'game',
    pick_label: details,
    confidence: Math.round(Math.min(85, Math.max(25, coverProb)) * 10) / 10,
    implied_probability: impliedProb,
    edge: Math.round(edge * 10) / 10,
    odds: '-110',
    reasoning: `Spread: ${details}. ${homeRec ? `Home team ${homeRec.wins}-${homeRec.losses}` : ''}${awayRec ? `, away ${awayRec.wins}-${awayRec.losses}` : ''}.`,
    factors: { spread, cover_probability: coverProb },
  });

  return picks;
}

function analyzeTotals(event: EnrichedEvent): AnalyzedPick[] {
  const picks: AnalyzedPick[] = [];
  const odds = event.odds_data as Record<string, unknown> | null;
  if (!odds) return picks;

  const overUnder = odds.overUnder as number | undefined;
  if (overUnder == null) return picks;

  let overProb = 50;
  const reasons: string[] = [`Line set at ${overUnder}`];

  // Weather adjustments for outdoor sports
  if (event.weather && !event.indoor) {
    if (event.weather.condition.toLowerCase().includes('rain')) {
      overProb -= 5;
      reasons.push('rain favors under');
    }
    if (event.weather.condition.toLowerCase().includes('wind')) {
      overProb -= 3;
      reasons.push('wind reduces scoring');
    }
    if (event.weather.temperature > 80 && event.sport === 'MLB') {
      overProb += 3;
      reasons.push('warm weather boosts offense');
    }
    if (event.weather.temperature < 40) {
      overProb -= 2;
      reasons.push('cold weather suppresses scoring');
    }
  }

  if (event.indoor) {
    overProb += 1;
    reasons.push('indoor venue — controlled conditions');
  }

  const impliedProb = 52.4;

  picks.push({
    pick_type: 'total',
    pick_category: 'game',
    pick_label: `Over ${overUnder}`,
    confidence: Math.round(Math.min(80, Math.max(25, overProb)) * 10) / 10,
    implied_probability: impliedProb,
    edge: Math.round((overProb - impliedProb) * 10) / 10,
    odds: '-110',
    reasoning: reasons.join('. ') + '.',
    factors: { over_under: overUnder, over_probability: overProb },
  });

  picks.push({
    pick_type: 'total',
    pick_category: 'game',
    pick_label: `Under ${overUnder}`,
    confidence: Math.round(Math.min(80, Math.max(25, 100 - overProb)) * 10) / 10,
    implied_probability: impliedProb,
    edge: Math.round(((100 - overProb) - impliedProb) * 10) / 10,
    odds: '-110',
    reasoning: reasons.join('. ') + '.',
    factors: { over_under: overUnder, under_probability: 100 - overProb },
  });

  return picks;
}

// --- Main analysis ---

export async function analyzeEvent(event: EnrichedEvent, _includeProps = false): Promise<AnalyzedPick[]> {
  const allPicks: AnalyzedPick[] = [];

  allPicks.push(...analyzeMoneyline(event));
  allPicks.push(...analyzeSpread(event));
  allPicks.push(...analyzeTotals(event));

  // Store in DB
  for (const pick of allPicks) {
    const id = crypto.randomUUID();
    await sql`
      insert into picks (id, event_id, sport, pick_type, pick_category, pick_label,
                         confidence, implied_probability, edge, odds, reasoning, factors)
      values (${id}, ${event.id}, ${event.sport}, ${pick.pick_type}, ${pick.pick_category},
              ${pick.pick_label}, ${pick.confidence}, ${pick.implied_probability},
              ${pick.edge}, ${pick.odds}, ${pick.reasoning}, ${JSON.stringify(pick.factors)})
    `;
  }

  return allPicks;
}

export async function getPicksForEvent(eventId: string) {
  return sql`select * from picks where event_id = ${eventId} order by confidence desc`;
}

export async function getTopPicks(sport?: Sport, category?: string, limit = 30) {
  if (sport && category) {
    return sql`
      select p.*, e.title as event_title, e.commence_time
      from picks p join events e on p.event_id = e.id
      where p.sport = ${sport} and p.pick_category = ${category} and e.commence_time > now()
      order by p.edge desc nulls last, p.confidence desc
      limit ${limit}
    `;
  }
  if (sport) {
    return sql`
      select p.*, e.title as event_title, e.commence_time
      from picks p join events e on p.event_id = e.id
      where p.sport = ${sport} and e.commence_time > now()
      order by p.edge desc nulls last, p.confidence desc
      limit ${limit}
    `;
  }
  return sql`
    select p.*, e.title as event_title, e.commence_time
    from picks p join events e on p.event_id = e.id
    where e.commence_time > now()
    order by p.edge desc nulls last, p.confidence desc
    limit ${limit}
  `;
}

// --- Parlay builder (pure algorithm) ---

const STRATEGY_CONFIG: Record<Strategy, { minConfidence: number; minEdge: number; maxLegs: number; preferFavorites: boolean }> = {
  safe: { minConfidence: 65, minEdge: 0, maxLegs: 4, preferFavorites: true },
  balanced: { minConfidence: 50, minEdge: -3, maxLegs: 6, preferFavorites: false },
  aggressive: { minConfidence: 35, minEdge: -10, maxLegs: 8, preferFavorites: false },
};

export async function generateParlay(
  sport?: Sport,
  legCount = 3,
  strategy: Strategy = 'balanced',
  includeProps = false
) {
  let picks = await getTopPicks(sport, undefined, 60);

  if (picks.length < legCount) {
    const sportsToAnalyze = sport ? [sport] : SPORTS;
    for (const s of sportsToAnalyze) {
      const events = await syncEvents(s);
      for (const event of events.slice(0, 6)) {
        await analyzeEvent(event, includeProps).catch(() => []);
      }
    }
    picks = await getTopPicks(sport, undefined, 60);
  }

  if (picks.length < legCount) {
    throw new Error(`Not enough picks available (found ${picks.length}, need ${legCount}). No upcoming events with odds data for ${sport ?? 'any sport'}.`);
  }

  const config = STRATEGY_CONFIG[strategy];

  // Filter picks by strategy thresholds
  let eligible = picks.filter((p: Record<string, unknown>) => {
    const conf = p.confidence as number;
    const edge = p.edge as number;
    return conf >= config.minConfidence && edge >= config.minEdge;
  });

  if (eligible.length < legCount) {
    eligible = picks.slice(0, Math.max(legCount * 3, 20));
  }

  // Score and rank picks
  const scored = eligible.map((p: Record<string, unknown>) => {
    const conf = p.confidence as number;
    const edge = p.edge as number;
    let score = conf * 0.6 + Math.max(0, edge) * 4;
    if (config.preferFavorites && conf > 60) score += 10;
    if (!config.preferFavorites && edge > 3) score += 15;
    return { pick: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Select legs — avoid duplicate events
  const selected: Array<Record<string, unknown>> = [];
  const usedEvents = new Set<string>();

  for (const { pick } of scored) {
    if (selected.length >= legCount) break;
    const eventId = pick.event_id as string;
    if (usedEvents.has(eventId)) continue;
    selected.push(pick);
    usedEvents.add(eventId);
  }

  if (selected.length < legCount) {
    for (const { pick } of scored) {
      if (selected.length >= legCount) break;
      if (selected.includes(pick)) continue;
      selected.push(pick);
    }
  }

  // Calculate combined stats
  const confidences = selected.map(p => p.confidence as number);
  const confidenceAvg = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const impliedProbs = selected.map(p => (p.implied_probability as number) / 100);
  const combinedImplied = impliedProbs.reduce((a, b) => a * b, 1) * 100;

  const combinedOdds = impliedToAmerican(combinedImplied);

  const pickIds = selected.map(p => p.id as string);
  const labels = selected.map(p => `${p.pick_label} (${p.odds})`).join(', ');

  const reasoning = `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} ${legCount}-leg parlay across ${usedEvents.size} events. ${
    strategy === 'safe' ? 'Focused on high-confidence favorites with positive edge.' :
    strategy === 'balanced' ? 'Mixed value picks balancing confidence and edge.' :
    'Higher-risk picks targeting plus-money value.'
  } Legs: ${labels}.`;

  const id = crypto.randomUUID();
  await sql`
    insert into generated_parlays (id, strategy, sport_filter, pick_ids, pick_details,
                                   combined_odds, combined_implied_prob, confidence_avg,
                                   reasoning, result)
    values (${id}, ${strategy}, ${sport ?? null}, ${pickIds},
            ${JSON.stringify(selected)}, ${combinedOdds},
            ${combinedImplied}, ${confidenceAvg},
            ${reasoning}, 'pending')
  `;

  return { id, strategy, pick_ids: pickIds, combined_odds: combinedOdds, combined_implied_prob: combinedImplied, confidence_avg: confidenceAvg, reasoning, picks: selected };
}

// --- Win/Loss Tracking ---

export async function settleParlay(
  parlayId: string,
  result: 'win' | 'loss' | 'push' | 'partial',
  legResults: Record<string, 'win' | 'loss' | 'push'>,
  actualPayout?: number,
  wagerAmount?: number
) {
  await sql`
    update generated_parlays
    set result = ${result},
        leg_results = ${JSON.stringify(legResults)},
        actual_payout = ${actualPayout ?? null},
        wager_amount = ${wagerAmount ?? null},
        settled_at = now()
    where id = ${parlayId}
  `;

  const parlay = (await sql`select * from generated_parlays where id = ${parlayId}`)[0];
  if (!parlay) return;

  const pickIdsArr: string[] = parlay.pick_ids;
  for (const pickId of pickIdsArr) {
    const pickResult = legResults[pickId];
    if (!pickResult) continue;

    const pick = (await sql`select * from picks where id = ${pickId}`)[0];
    if (!pick) continue;

    const perfId = crypto.randomUUID();
    await sql`
      insert into performance_log (id, pick_id, parlay_id, sport, pick_type, pick_category,
                                   strategy, confidence_at_pick, odds_at_pick, result)
      values (${perfId}, ${pickId}, ${parlayId}, ${pick.sport}, ${pick.pick_type},
              ${pick.pick_category}, ${parlay.strategy}, ${pick.confidence},
              ${pick.odds}, ${pickResult})
    `;
  }
}

export async function getPerformanceStats(sport?: Sport) {
  const overall = sport
    ? await sql`
        select result, count(*)::int as cnt
        from generated_parlays where result is not null and sport_filter = ${sport}
        group by result
      `
    : await sql`
        select result, count(*)::int as cnt
        from generated_parlays where result is not null
        group by result
      `;

  const byStrategy = await sql`
    select strategy, result, count(*)::int as cnt,
           round(avg(confidence_avg), 1) as avg_conf
    from generated_parlays where result is not null
    group by strategy, result
    order by strategy, result
  `;

  const byPickType = await sql`
    select sport, pick_type, pick_category, result, count(*)::int as cnt,
           round(avg(confidence_at_pick), 1) as avg_conf
    from performance_log
    group by sport, pick_type, pick_category, result
    order by sport, pick_type, result
  `;

  return { overall, byStrategy, byPickType, insights: [] };
}

export async function getParlayHistory(limit = 50) {
  return sql`
    select * from generated_parlays
    order by created_at desc
    limit ${limit}
  `;
}
