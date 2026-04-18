import type { Sport } from './sports-data.js';

// --- MLB Stats API (statsapi.mlb.com) — completely free, no key ---

interface MLBProbablePitcher {
  name: string;
  era: string;
  wins: number;
  losses: number;
  strikeouts: number;
  whip: string;
}

interface MLBGameData {
  gameId: string;
  teams: { away: string; home: string };
  probablePitchers: { away: MLBProbablePitcher | null; home: MLBProbablePitcher | null };
  venue: string;
}

export async function fetchMLBProbablePitchers(): Promise<MLBGameData[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=probablePitcher(note),venue,team`
    );
    if (!res.ok) return [];
    const data = await res.json() as { dates?: Array<{ games?: Array<Record<string, unknown>> }> };
    const games = data.dates?.[0]?.games ?? [];

    return games.map((g: Record<string, unknown>) => {
      const teams = g.teams as Record<string, Record<string, unknown>>;
      const away = teams?.away;
      const home = teams?.home;
      const awayPitcher = away?.probablePitcher as Record<string, unknown> | undefined;
      const homePitcher = home?.probablePitcher as Record<string, unknown> | undefined;
      const venue = g.venue as Record<string, unknown> | undefined;

      return {
        gameId: String(g.gamePk ?? ''),
        teams: {
          away: (away?.team as Record<string, unknown>)?.name as string ?? '',
          home: (home?.team as Record<string, unknown>)?.name as string ?? '',
        },
        probablePitchers: {
          away: awayPitcher ? {
            name: awayPitcher.fullName as string ?? '',
            era: String(awayPitcher.era ?? '0.00'),
            wins: Number(awayPitcher.wins ?? 0),
            losses: Number(awayPitcher.losses ?? 0),
            strikeouts: Number(awayPitcher.strikeOuts ?? 0),
            whip: String(awayPitcher.whip ?? '0.00'),
          } : null,
          home: homePitcher ? {
            name: homePitcher.fullName as string ?? '',
            era: String(homePitcher.era ?? '0.00'),
            wins: Number(homePitcher.wins ?? 0),
            losses: Number(homePitcher.losses ?? 0),
            strikeouts: Number(homePitcher.strikeOuts ?? 0),
            whip: String(homePitcher.whip ?? '0.00'),
          } : null,
        },
        venue: (venue?.name as string) ?? '',
      };
    });
  } catch { return []; }
}

export async function fetchMLBStandings(): Promise<string> {
  try {
    const res = await fetch('https://statsapi.mlb.com/api/v1/standings?leagueId=103,104');
    if (!res.ok) return '';
    const data = await res.json() as { records?: Array<Record<string, unknown>> };
    const lines: string[] = [];
    for (const div of data.records ?? []) {
      const divName = (div.division as Record<string, unknown>)?.name ?? 'Unknown';
      lines.push(`\n${divName}:`);
      const teamRecords = div.teamRecords as Array<Record<string, unknown>> ?? [];
      for (const t of teamRecords) {
        const team = (t.team as Record<string, unknown>)?.name ?? '';
        lines.push(`  ${team}: ${t.wins}-${t.losses} (${t.winningPercentage})`);
      }
    }
    return lines.join('\n');
  } catch { return ''; }
}

export async function fetchMLBTeamStats(teamId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting,pitching`);
    if (!res.ok) return null;
    return await res.json() as Record<string, unknown>;
  } catch { return null; }
}

// --- Open-Meteo (free weather, no key) ---

interface WeatherForecast {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  precipitation: number;
  condition: string;
}

export async function fetchWeatherForVenue(lat: number, lon: number, dateStr: string): Promise<WeatherForecast | null> {
  try {
    const date = dateStr.slice(0, 10);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant,relative_humidity_2m_max&start_date=${date}&end_date=${date}&temperature_unit=fahrenheit&windspeed_unit=mph`
    );
    if (!res.ok) return null;
    const data = await res.json() as { daily?: Record<string, number[]> };
    const d = data.daily;
    if (!d) return null;

    const temp = Math.round(((d.temperature_2m_max?.[0] ?? 70) + (d.temperature_2m_min?.[0] ?? 50)) / 2);
    const wind = d.windspeed_10m_max?.[0] ?? 0;
    const precip = d.precipitation_sum?.[0] ?? 0;

    let condition = 'Clear';
    if (precip > 0.5) condition = 'Rain';
    else if (precip > 0) condition = 'Light Rain';
    if (wind > 20) condition += ', Windy';

    return {
      temperature: temp,
      windSpeed: Math.round(wind),
      windDirection: d.winddirection_10m_dominant?.[0] ?? 0,
      humidity: d.relative_humidity_2m_max?.[0] ?? 0,
      precipitation: precip,
      condition,
    };
  } catch { return null; }
}

// Known venue coordinates for MLB and NFL
const VENUE_COORDS: Record<string, [number, number]> = {
  'Yankee Stadium': [40.8296, -73.9262],
  'Fenway Park': [42.3467, -71.0972],
  'Dodger Stadium': [34.0739, -118.2400],
  'Wrigley Field': [41.9484, -87.6553],
  'Oracle Park': [37.7786, -122.3893],
  'Citi Field': [40.7571, -73.8458],
  'Truist Park': [33.8911, -84.4682],
  'Minute Maid Park': [29.7573, -95.3555],
  'Globe Life Field': [32.7472, -97.0844],
  'T-Mobile Park': [47.5914, -122.3326],
  'Petco Park': [32.7076, -117.1570],
  'Citizens Bank Park': [39.9061, -75.1665],
  'Busch Stadium': [38.6226, -90.1928],
  'Kauffman Stadium': [39.0517, -94.4803],
  'Comerica Park': [42.3390, -83.0485],
  'Progressive Field': [41.4962, -81.6852],
  'Target Field': [44.9818, -93.2775],
  'Guaranteed Rate Field': [41.8300, -87.6339],
  'PNC Park': [40.4468, -80.0057],
  'Great American Ball Park': [39.0974, -84.5065],
  'Nationals Park': [38.8730, -77.0074],
  'loanDepot park': [25.7781, -80.2196],
  'Tropicana Field': [27.7682, -82.6534],
  'Angel Stadium': [33.8003, -117.8827],
  'Oakland Coliseum': [37.7516, -122.2005],
  'Chase Field': [33.4455, -112.0667],
  'Coors Field': [39.7559, -104.9942],
  'Rogers Centre': [43.6414, -79.3894],
  'American Family Field': [43.0280, -87.9712],
  'Arrowhead Stadium': [39.0489, -94.4839],
  'SoFi Stadium': [33.9535, -118.3392],
  'Allegiant Stadium': [36.0909, -115.1833],
  'MetLife Stadium': [40.8135, -74.0745],
  'Gillette Stadium': [42.0909, -71.2643],
  'Highmark Stadium': [42.7738, -78.7870],
  'Hard Rock Stadium': [25.9580, -80.2389],
  'M&T Bank Stadium': [39.2780, -76.6227],
  'Acrisure Stadium': [40.4468, -80.0158],
  'Paul Brown Stadium': [39.0955, -84.5161],
  'FirstEnergy Stadium': [41.5061, -81.6995],
  'Ford Field': [42.3400, -83.0456],
  'Lambeau Field': [44.5013, -88.0622],
  'U.S. Bank Stadium': [44.9736, -93.2575],
  'Soldier Field': [41.8623, -87.6167],
  'AT&T Stadium': [32.7473, -97.0945],
  'Lincoln Financial Field': [39.9008, -75.1675],
  'FedExField': [38.9076, -76.8645],
  'Bank of America Stadium': [35.2258, -80.8528],
  'Mercedes-Benz Stadium': [33.7553, -84.4006],
  'Raymond James Stadium': [27.9759, -82.5033],
  'Caesars Superdome': [29.9511, -90.0812],
  'Lumen Field': [47.5952, -122.3316],
  'State Farm Stadium': [33.5276, -112.2626],
  'Levi\'s Stadium': [37.4033, -121.9694],
  'Empower Field at Mile High': [39.7439, -105.0201],
  'GEHA Field at Arrowhead Stadium': [39.0489, -94.4839],
  'Lucas Oil Stadium': [39.7601, -86.1639],
  'NRG Stadium': [29.6847, -95.4107],
  'EverBank Stadium': [30.3239, -81.6373],
  'Nissan Stadium': [36.1665, -86.7713],
};

export function getVenueCoords(venue: string): [number, number] | null {
  if (VENUE_COORDS[venue]) return VENUE_COORDS[venue];
  for (const [name, coords] of Object.entries(VENUE_COORDS)) {
    if (venue.toLowerCase().includes(name.toLowerCase().split(' ')[0])) return coords;
  }
  return null;
}

// --- UFC Stats (ufcstats.com) — public data ---

export async function fetchUFCEventStats(): Promise<string> {
  try {
    const res = await fetch('http://ufcstats.com/statistics/events/completed?page=all', {
      headers: { 'User-Agent': 'ParlayPulse/1.0' },
    });
    if (!res.ok) return '';
    const html = await res.text();
    const eventLinks = html.match(/href="(http:\/\/ufcstats\.com\/event-details\/[^"]+)"/g)?.slice(0, 3) ?? [];
    return `Recent UFC events: ${eventLinks.length} found`;
  } catch { return ''; }
}

// --- ESPN Additional Endpoints (free) ---

export async function fetchESPNStandings(sport: 'MLB' | 'NFL'): Promise<string> {
  const paths: Record<string, string> = { MLB: 'baseball/mlb', NFL: 'football/nfl' };
  try {
    const res = await fetch(`https://site.api.espn.com/apis/v2/sports/${paths[sport]}/standings`);
    if (!res.ok) return '';
    const data = await res.json() as { children?: Array<Record<string, unknown>> };
    const lines: string[] = [];

    for (const group of data.children ?? []) {
      const groupName = (group.name as string) ?? '';
      const standings = group.standings as Record<string, unknown> | undefined;
      const entries = (standings?.entries ?? []) as Array<Record<string, unknown>>;

      for (const entry of entries.slice(0, 5)) {
        const team = (entry.team as Record<string, unknown>)?.displayName ?? '';
        const stats = entry.stats as Array<Record<string, unknown>> ?? [];
        const wins = stats.find(s => s.name === 'wins')?.value ?? 0;
        const losses = stats.find(s => s.name === 'losses')?.value ?? 0;
        lines.push(`${groupName} - ${team}: ${wins}-${losses}`);
      }
    }
    return lines.join('\n');
  } catch { return ''; }
}

export async function fetchESPNPlayerStats(sport: Sport, teamId: string): Promise<string> {
  const paths: Record<string, string> = { UFC: 'mma/ufc', MLB: 'baseball/mlb', NFL: 'football/nfl' };
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${paths[sport]}/teams/${teamId}/roster`
    );
    if (!res.ok) return '';
    const data = await res.json() as { athletes?: Array<Record<string, unknown>> };
    const lines: string[] = [];

    for (const group of data.athletes ?? []) {
      const items = group.items as Array<Record<string, unknown>> ?? [];
      for (const athlete of items.slice(0, 10)) {
        const name = athlete.displayName ?? athlete.fullName ?? '';
        const pos = (athlete.position as Record<string, unknown>)?.abbreviation ?? '';
        const injuries = athlete.injuries as Array<Record<string, unknown>> ?? [];
        const injStatus = injuries.length > 0 ? ` [${injuries[0].status}]` : '';
        lines.push(`${name} (${pos})${injStatus}`);
      }
    }
    return lines.join('\n');
  } catch { return ''; }
}

// --- Aggregate all external data for a sport ---

export async function gatherExternalData(sport: Sport, eventTitle: string, venue?: string | null, eventDate?: string): Promise<string> {
  const sections: string[] = [];

  if (sport === 'MLB') {
    const [pitchers, standings] = await Promise.all([
      fetchMLBProbablePitchers(),
      fetchMLBStandings(),
    ]);

    if (pitchers.length > 0) {
      const relevant = pitchers.filter(g =>
        eventTitle.toLowerCase().includes(g.teams.away.toLowerCase().split(' ').pop()!) ||
        eventTitle.toLowerCase().includes(g.teams.home.toLowerCase().split(' ').pop()!)
      );
      if (relevant.length > 0) {
        sections.push('## MLB Probable Pitchers (via MLB Stats API)');
        for (const g of relevant) {
          if (g.probablePitchers.away) {
            const p = g.probablePitchers.away;
            sections.push(`Away: ${p.name} (${p.wins}-${p.losses}, ${p.era} ERA, ${p.whip} WHIP, ${p.strikeouts} K)`);
          }
          if (g.probablePitchers.home) {
            const p = g.probablePitchers.home;
            sections.push(`Home: ${p.name} (${p.wins}-${p.losses}, ${p.era} ERA, ${p.whip} WHIP, ${p.strikeouts} K)`);
          }
        }
      }
    }

    if (standings) {
      sections.push('\n## MLB Standings\n' + standings);
    }
  }

  if (sport === 'NFL') {
    const standings = await fetchESPNStandings('NFL');
    if (standings) sections.push('## NFL Standings\n' + standings);
  }

  if (venue && eventDate && (sport === 'MLB' || sport === 'NFL')) {
    const coords = getVenueCoords(venue);
    if (coords) {
      const weather = await fetchWeatherForVenue(coords[0], coords[1], eventDate);
      if (weather) {
        sections.push(`## Detailed Weather Forecast (Open-Meteo)
Temperature: ${weather.temperature}°F
Wind: ${weather.windSpeed} mph (direction: ${weather.windDirection}°)
Humidity: ${weather.humidity}%
Precipitation: ${weather.precipitation} mm
Conditions: ${weather.condition}`);
      }
    }
  }

  return sections.length > 0
    ? '\n# External Data Sources\n' + sections.join('\n\n')
    : '';
}
