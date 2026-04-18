import { sql } from './db';
import { fetchESPNEvents, fetchESPNInjuries, type ParsedEvent, type ESPNOdds } from './espn';

export type Sport = 'UFC' | 'MLB' | 'NFL';
export const SPORTS: Sport[] = ['UFC', 'MLB', 'NFL'];

export interface EnrichedEvent {
  id: string;
  sport: Sport;
  title: string;
  commence_time: string;
  home_team: string | null;
  away_team: string | null;
  home_record: string | null;
  away_record: string | null;
  venue: string | null;
  indoor: boolean;
  odds_data: ESPNOdds | null;
  injuries: Array<{ player: string; team: string; status: string; details: string; position: string }>;
  weather: { temperature: number; condition: string } | null;
  stats: Record<string, unknown> | null;
}

export async function syncEvents(sport: Sport): Promise<EnrichedEvent[]> {
  const [espnEvents, injuries] = await Promise.all([
    fetchESPNEvents(sport),
    fetchESPNInjuries(sport).catch(() => []),
  ]);

  const enriched: EnrichedEvent[] = [];

  for (const evt of espnEvents) {
    const eventInjuries = injuries.filter(i =>
      (evt.home_team && i.team.toLowerCase().includes(evt.home_team.toLowerCase())) ||
      (evt.away_team && i.team.toLowerCase().includes(evt.away_team.toLowerCase()))
    );

    const event: EnrichedEvent = {
      id: evt.id,
      sport,
      title: evt.title,
      commence_time: evt.date,
      home_team: evt.home_team,
      away_team: evt.away_team,
      home_record: evt.home_record,
      away_record: evt.away_record,
      venue: evt.venue,
      indoor: evt.indoor,
      odds_data: evt.odds,
      injuries: eventInjuries,
      weather: evt.weather,
      stats: null,
    };

    await sql`
      insert into events (id, sport, title, commence_time, home_team, away_team, venue,
                          odds_data, injuries_data, weather_data, last_fetched_at)
      values (${event.id}, ${sport}, ${event.title}, ${event.commence_time},
              ${event.home_team}, ${event.away_team}, ${event.venue},
              ${JSON.stringify(event.odds_data)}, ${JSON.stringify(event.injuries)},
              ${JSON.stringify(event.weather)}, now())
      on conflict (id) do update set
        odds_data = excluded.odds_data,
        injuries_data = excluded.injuries_data,
        weather_data = excluded.weather_data,
        last_fetched_at = now()
    `;

    enriched.push(event);
  }

  return enriched;
}

export async function getCachedEvents(sport?: Sport) {
  if (sport) {
    return sql`
      select * from events
      where sport = ${sport} and commence_time > now()
      order by commence_time asc
    `;
  }
  return sql`
    select * from events
    where commence_time > now()
    order by commence_time asc
  `;
}
