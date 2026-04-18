const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const SPORT_PATHS: Record<string, string> = {
  UFC: 'mma/ufc',
  MLB: 'baseball/mlb',
  NFL: 'football/nfl',
};

export interface ESPNCompetitor {
  homeAway: string;
  team: { id: string; displayName: string; abbreviation: string; logo?: string };
  records?: Array<{ summary: string; type: string }>;
  score?: string;
  statistics?: Array<{ name: string; value: string }>;
}

export interface ESPNOdds {
  provider: { name: string };
  details: string;
  overUnder: number;
  spread: number;
  overOdds?: number;
  underOdds?: number;
  awayTeamOdds?: { moneyLine: number; spreadOdds: number };
  homeTeamOdds?: { moneyLine: number; spreadOdds: number };
}

export interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: { type: { state: string; description: string } };
  competitions: Array<{
    venue?: { fullName: string; city: string; state?: string; indoor?: boolean };
    competitors: ESPNCompetitor[];
    odds?: ESPNOdds[];
    weather?: { temperature: number; displayValue: string; conditionId: string };
    broadcasts?: Array<{ names: string[] }>;
  }>;
}

export interface ESPNInjury {
  team: string;
  player: string;
  position: string;
  status: string;
  details: string;
}

export interface ParsedEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  home_team: string | null;
  away_team: string | null;
  home_record: string | null;
  away_record: string | null;
  venue: string | null;
  indoor: boolean;
  odds: ESPNOdds | null;
  weather: { temperature: number; condition: string } | null;
}

export async function fetchESPNEvents(sport: 'UFC' | 'MLB' | 'NFL'): Promise<ParsedEvent[]> {
  const path = SPORT_PATHS[sport];
  const res = await fetch(`${ESPN_BASE}/${path}/scoreboard`);
  if (!res.ok) throw new Error(`ESPN scoreboard error: ${res.status}`);
  const data = await res.json();
  const events: ESPNEvent[] = data.events ?? [];

  return events
    .filter(e => e.status.type.state === 'pre')
    .map(e => {
      const comp = e.competitions[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');

      return {
        id: e.id,
        title: e.name,
        date: e.date,
        status: e.status.type.state,
        home_team: home?.team.displayName ?? null,
        away_team: away?.team.displayName ?? null,
        home_record: home?.records?.[0]?.summary ?? null,
        away_record: away?.records?.[0]?.summary ?? null,
        venue: comp?.venue?.fullName ?? null,
        indoor: comp?.venue?.indoor ?? false,
        odds: comp?.odds?.[0] ?? null,
        weather: comp?.weather
          ? { temperature: comp.weather.temperature, condition: comp.weather.displayValue }
          : null,
      };
    });
}

export async function fetchESPNInjuries(sport: 'UFC' | 'MLB' | 'NFL'): Promise<ESPNInjury[]> {
  const path = SPORT_PATHS[sport];
  const res = await fetch(`${ESPN_BASE}/${path}/injuries`);
  if (!res.ok) return [];
  const data = await res.json();
  const injuries: ESPNInjury[] = [];
  for (const team of data.items ?? []) {
    const teamName = team.team?.displayName ?? 'Unknown';
    for (const item of team.injuries ?? []) {
      injuries.push({
        team: teamName,
        player: item.athlete?.displayName ?? 'Unknown',
        position: item.athlete?.position?.abbreviation ?? '',
        status: item.status ?? 'Unknown',
        details: item.longComment ?? item.shortComment ?? '',
      });
    }
  }
  return injuries;
}

export async function fetchTeamStats(sport: 'MLB' | 'NFL', teamId: string) {
  const path = SPORT_PATHS[sport];
  const res = await fetch(`${ESPN_BASE}/${path}/teams/${teamId}/statistics`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchTeamRoster(sport: 'UFC' | 'MLB' | 'NFL', teamId: string) {
  const path = SPORT_PATHS[sport];
  const res = await fetch(`${ESPN_BASE}/${path}/teams/${teamId}/roster`);
  if (!res.ok) return null;
  return res.json();
}
