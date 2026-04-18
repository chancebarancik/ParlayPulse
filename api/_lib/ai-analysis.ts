import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from './db.js';
import { syncEvents, type EnrichedEvent, type Sport, SPORTS } from './sports-data.js';
import { gatherInsiderIntel, formatIntelForAnalysis } from './insider-intel.js';
import { gatherExternalData } from './external-data.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateJSON(prompt: string, maxTokens = 4000): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  });
  return result.response.text();
}

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

const PICK_TYPES_BY_SPORT: Record<Sport, string> = {
  UFC: `Pick types to generate:
GAME: moneyline (fight winner)
METHOD: method of victory (KO/TKO, submission, decision)
ROUND: over/under rounds, fight to go the distance, round betting
PLAYER_PROP: significant strikes over/under, takedowns over/under, knockdowns`,

  MLB: `Pick types to generate:
GAME: moneyline (game winner), run line (spread), over/under total runs
INNING: first 5 innings (F5) winner, F5 over/under
TEAM_PROP: team total runs over/under, team to score first
PLAYER_PROP: pitcher strikeouts over/under, batter hits over/under, home runs, RBIs, total bases`,

  NFL: `Pick types to generate:
GAME: moneyline (game winner), point spread, over/under total points
TEAM_PROP: team total points over/under, team to score first, total touchdowns
PLAYER_PROP: passing yards over/under, rushing yards over/under, receiving yards over/under, anytime touchdown scorer, interceptions`,
};

const PROBABILITY_FACTORS = `
## Probability Factors to Consider (weight ALL of these):
1. Historical head-to-head records
2. Recent form (last 5-10 games/fights)
3. Home/away or venue advantage
4. Rest days and scheduling
5. Injury report and player availability
6. Weather conditions (outdoor sports)
7. Coaching/corner matchups and tendencies
8. Public betting percentages and line movement (sharp vs public money)
9. Statistical matchup advantages (style, pace, efficiency)
10. Situational spots (revenge games, letdown spots, trap games)
11. Referee/judge tendencies (UFC)
12. Park factors and ballpark dimensions (MLB)
13. Division/conference standings impact
14. Travel and time zone effects
15. Historical performance in similar conditions`;

async function getHistoricalPerformance(sport?: Sport): Promise<string> {
  const perfData = sport
    ? await sql`
        select pick_type, pick_category, result, count(*)::int as cnt,
               round(avg(confidence_at_pick), 1) as avg_conf
        from performance_log
        where sport = ${sport}
        group by pick_type, pick_category, result
        order by pick_type, result
      `
    : await sql`
        select sport, pick_type, pick_category, result, count(*)::int as cnt,
               round(avg(confidence_at_pick), 1) as avg_conf
        from performance_log
        group by sport, pick_type, pick_category, result
        order by sport, pick_type, result
      `;

  if (perfData.length === 0) return 'No historical data yet — this is the first analysis.';

  const insights = await sql`
    select sport, pick_type, pick_category, insight, win_rate, sample_size, recommendation
    from learning_insights
    where sample_size >= 5
    order by updated_at desc
    limit 20
  `;

  let report = '## Historical Performance Data\n';
  for (const row of perfData) {
    report += `- ${row.sport ?? sport} ${row.pick_category}/${row.pick_type}: ${row.result}=${row.cnt} (avg confidence: ${row.avg_conf}%)\n`;
  }

  if (insights.length > 0) {
    report += '\n## Learning Insights (from past results)\n';
    for (const ins of insights) {
      report += `- [${ins.sport} ${ins.pick_type}] ${ins.insight} (win rate: ${ins.win_rate}%, n=${ins.sample_size}). ${ins.recommendation}\n`;
    }
  }

  return report;
}

export async function analyzeEvent(event: EnrichedEvent, includeProps = false): Promise<AnalyzedPick[]> {
  const oddsStr = event.odds_data
    ? JSON.stringify(event.odds_data, null, 2)
    : 'No odds available';

  const injuriesStr = event.injuries.length > 0
    ? event.injuries.map(i => `${i.player} (${i.team}): ${i.status} - ${i.details}`).join('\n')
    : 'No injury data available';

  const [historicalPerf, insiderIntel, externalData] = await Promise.all([
    getHistoricalPerformance(event.sport),
    gatherInsiderIntel(event.sport, event.title, event.odds_data).catch(() => null),
    gatherExternalData(event.sport, event.title, event.venue, event.commence_time).catch(() => ''),
  ]);

  const intelReport = insiderIntel ? formatIntelForAnalysis(insiderIntel) : 'No insider intelligence available.';

  const propInstruction = includeProps
    ? 'Include at least 2 player/team prop picks alongside game picks.'
    : 'Focus primarily on game-level picks (moneyline, spread, totals). Include 1 prop pick only if you see strong value.';

  const prompt = `You are an elite sports betting analyst with deep expertise in ${event.sport}. Your job is to find the HIGHEST PROBABILITY picks by analyzing every available factor.

## Event
${event.title}
Date: ${event.commence_time}
Venue: ${event.venue ?? 'Unknown'}${event.indoor ? ' (Indoor)' : ''}
Home: ${event.home_team ?? 'N/A'} (Record: ${event.home_record ?? 'N/A'})
Away: ${event.away_team ?? 'N/A'} (Record: ${event.away_record ?? 'N/A'})
${event.weather ? `Weather: ${event.weather.condition}, ${event.weather.temperature}°F` : ''}

## Current Odds
${oddsStr}

## Injury Report
${injuriesStr}

## Additional Stats
${event.stats ? JSON.stringify(event.stats, null, 2) : 'No additional stats available'}

${externalData}

${historicalPerf}

${intelReport}

${PROBABILITY_FACTORS}

## Available Pick Types for ${event.sport}
${PICK_TYPES_BY_SPORT[event.sport]}

## Instructions
${propInstruction}

Generate 4-8 picks for this event. For EACH pick, you must calculate:
- pick_type: market type (moneyline, spread, total, method_of_victory, player_strikeouts_ou, etc.)
- pick_category: one of "game", "player_prop", "team_prop", "method", "round", "inning"
- pick_label: the specific pick (e.g., "Chiefs -3.5", "Over 45.5", "Mahomes 280+ passing yards")
- confidence: 0-100 score. This MUST reflect true probability, not optimism. Be brutally honest. A -300 favorite is ~75%, not 90%.
- implied_probability: the implied probability from the odds (e.g., -150 = 60.0)
- edge: your confidence minus implied_probability. Positive = value bet. This is the most important number.
- odds: American odds (e.g., "-110", "+150")
- reasoning: 2-3 sentences with specific stats and data points
- factors: object with key factors and their impact (e.g., {"home_advantage": 3.2, "injury_impact": -5.0, "recent_form": 8.5, "matchup_edge": 4.0})

CRITICAL: Your confidence scores must be CALIBRATED. If you say 80% confidence, that pick should win ~80% of the time. Study the historical performance data above and adjust. If past 75% confidence picks only won 60%, recalibrate downward.

Respond with ONLY a valid JSON array. No markdown fences, no explanation outside the JSON.`;

  const text = await generateJSON(prompt, 4000);
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const picks: AnalyzedPick[] = JSON.parse(cleaned);

  for (const pick of picks) {
    const id = crypto.randomUUID();
    await sql`
      insert into picks (id, event_id, sport, pick_type, pick_category, pick_label,
                         confidence, implied_probability, edge, odds, reasoning, factors)
      values (${id}, ${event.id}, ${event.sport}, ${pick.pick_type}, ${pick.pick_category},
              ${pick.pick_label}, ${pick.confidence}, ${pick.implied_probability},
              ${pick.edge}, ${pick.odds}, ${pick.reasoning}, ${JSON.stringify(pick.factors)})
    `;
  }

  return picks;
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

const STRATEGY_RULES: Record<Strategy, string> = {
  safe: `SAFE STRATEGY:
- Only use picks with confidence >= 70 and positive edge
- Prefer moneylines and spreads over props
- Max 3-4 legs to keep combined probability high
- Target combined implied probability > 15%
- Avoid correlated legs from the same game
- Prioritize favorites with strong edges`,

  balanced: `BALANCED STRATEGY:
- Use picks with confidence >= 55 and positive or near-zero edge
- Mix game picks with 1-2 props if they have value
- 3-5 legs for decent odds with reasonable hit probability
- Target combined implied probability > 5%
- Can include slight underdogs if edge is strong
- Balance risk across different events`,

  aggressive: `AGGRESSIVE STRATEGY:
- Include some lower confidence picks (45+) with high odds for big payouts
- Props and method/round picks encouraged for odds boost
- 4-6 legs, targeting higher combined odds (+800 or better)
- At least 2 legs must have confidence > 60 as anchors
- Seek value in plus-money picks where edge is positive
- Acceptable to take correlated legs if correlation works in your favor`,
};

export async function generateParlay(
  sport?: Sport,
  legCount = 3,
  strategy: Strategy = 'balanced',
  includeProps = false
) {
  let picks = await getTopPicks(sport, undefined, 40);

  if (picks.length < legCount) {
    const sportsToAnalyze = sport ? [sport] : SPORTS;
    const errors: string[] = [];
    for (const s of sportsToAnalyze) {
      try {
        const events = await syncEvents(s);
        for (const event of events.slice(0, 4)) {
          try {
            await analyzeEvent(event, includeProps);
          } catch (e: unknown) {
            errors.push(`analyzeEvent(${event.title}): ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      } catch (e: unknown) {
        errors.push(`syncEvents(${s}): ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    picks = await getTopPicks(sport, undefined, 40);

    if (picks.length < legCount) {
      const errDetail = errors.length > 0 ? ` Errors: ${errors.join('; ')}` : '';
      throw new Error(`Not enough picks (found ${picks.length}, need ${legCount}).${errDetail}`);
    }
  }

  const historicalPerf = await getHistoricalPerformance(sport);

  const propRule = includeProps
    ? 'You MUST include at least 1 player or team prop pick in the parlay.'
    : 'Props are optional — include only if the edge is strong.';

  const prompt = `You are a parlay optimization expert. Build the best ${legCount}-leg parlay using the ${strategy.toUpperCase()} strategy.

${STRATEGY_RULES[strategy]}

${propRule}

## Available Picks
${JSON.stringify(picks, null, 2)}

${historicalPerf}

## Rules
1. Select exactly ${legCount} legs
2. Follow the ${strategy} strategy rules above
3. Calculate combined implied probability by multiplying individual probabilities
4. Factor in the historical performance data — avoid pick types with poor track records
5. Consider correlation between legs (same game, same team, same player)
6. Every pick MUST have a clear reasoning for inclusion

Respond with ONLY a valid JSON object:
{
  "pick_ids": ["id1", "id2", ...],
  "combined_odds": "+450",
  "combined_implied_prob": 12.5,
  "confidence_avg": 72.5,
  "reasoning": "2-3 sentences on why these legs work together and the strategy behind it"
}`;

  const text = await generateJSON(prompt, 1500);
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parlay = JSON.parse(cleaned);

  const selectedPicks = picks.filter((p: Record<string, unknown>) =>
    parlay.pick_ids.includes(p.id)
  );

  const id = crypto.randomUUID();
  await sql`
    insert into generated_parlays (id, strategy, sport_filter, pick_ids, pick_details,
                                   combined_odds, combined_implied_prob, confidence_avg,
                                   reasoning, result)
    values (${id}, ${strategy}, ${sport ?? null}, ${parlay.pick_ids},
            ${JSON.stringify(selectedPicks)}, ${parlay.combined_odds},
            ${parlay.combined_implied_prob}, ${parlay.confidence_avg},
            ${parlay.reasoning}, 'pending')
  `;

  return { id, strategy, ...parlay, picks: selectedPicks };
}

// --- Win/Loss Tracking & Learning ---

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

  const pickIds: string[] = parlay.pick_ids;
  for (const pickId of pickIds) {
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

  await updateLearningInsights();
}

export async function updateLearningInsights() {
  const stats = await sql`
    select sport, pick_type, pick_category,
           count(*)::int as total,
           count(*) filter (where result = 'win')::int as wins,
           round(100.0 * count(*) filter (where result = 'win') / nullif(count(*), 0), 1) as win_rate,
           round(avg(confidence_at_pick), 1) as avg_confidence
    from performance_log
    group by sport, pick_type, pick_category
    having count(*) >= 3
    order by sport, pick_type
  `;

  if (stats.length === 0) return;

  const prompt = `You are analyzing sports betting performance data to extract learning insights. Study this data and provide calibration adjustments.

## Performance Data
${JSON.stringify(stats, null, 2)}

For each row with sufficient data (5+ bets), generate an insight:
- If win_rate significantly differs from avg_confidence, note the miscalibration
- Identify which pick types are most/least profitable
- Note any patterns (e.g., "UFC method picks overperform at lower confidence levels")
- Provide a concrete recommendation for future picks

Respond with ONLY a valid JSON array:
[{
  "sport": "UFC",
  "pick_type": "moneyline",
  "pick_category": "game",
  "insight": "Moneyline picks are well-calibrated...",
  "sample_size": 25,
  "win_rate": 68.0,
  "avg_confidence": 65.2,
  "avg_edge": 3.1,
  "recommendation": "Continue using current confidence levels for moneyline picks"
}]

Only include entries with sample_size >= 5. If not enough data, return an empty array [].`;

  const text = await generateJSON(prompt, 2000);
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const insights = JSON.parse(cleaned);

  for (const ins of insights) {
    const id = crypto.randomUUID();
    await sql`
      insert into learning_insights (id, sport, pick_type, pick_category, insight,
                                     sample_size, win_rate, avg_confidence, avg_edge, recommendation)
      values (${id}, ${ins.sport}, ${ins.pick_type}, ${ins.pick_category}, ${ins.insight},
              ${ins.sample_size}, ${ins.win_rate}, ${ins.avg_confidence}, ${ins.avg_edge ?? null},
              ${ins.recommendation})
      on conflict (id) do nothing
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

  const insights = await sql`
    select * from learning_insights order by updated_at desc limit 20
  `;

  return { overall, byStrategy, byPickType, insights };
}

export async function getParlayHistory(limit = 50) {
  return sql`
    select * from generated_parlays
    order by created_at desc
    limit ${limit}
  `;
}
