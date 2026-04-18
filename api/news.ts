import type { VercelRequest, VercelResponse } from '@vercel/node';
import { type Sport, SPORTS } from './_lib/sports-data.js';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const SPORT_PATHS: Record<string, string> = {
  UFC: 'mma/ufc',
  MLB: 'baseball/mlb',
  NFL: 'football/nfl',
};

interface ESPNHeadline {
  headline?: string;
  description?: string;
  published?: string;
  type?: string;
  categories?: Array<{ type?: string; description?: string }>;
  images?: Array<{ url?: string; caption?: string }>;
  links?: { web?: { href?: string } };
}

interface NewsItem {
  title: string;
  summary: string;
  sport: string;
  type: string;
  published: string;
  image?: string;
  url?: string;
}

async function fetchSportNews(sport: Sport): Promise<NewsItem[]> {
  const path = SPORT_PATHS[sport];
  const items: NewsItem[] = [];

  try {
    const res = await fetch(`${ESPN_BASE}/${path}/news?limit=10`);
    if (res.ok) {
      const data = await res.json() as { articles?: ESPNHeadline[] };
      for (const article of data.articles ?? []) {
        items.push({
          title: article.headline ?? '',
          summary: article.description ?? '',
          sport,
          type: 'news',
          published: article.published ?? new Date().toISOString(),
          image: article.images?.[0]?.url,
          url: article.links?.web?.href,
        });
      }
    }
  } catch { /* silent */ }

  try {
    const injRes = await fetch(`${ESPN_BASE}/${path}/injuries`);
    if (injRes.ok) {
      interface InjuryTeam {
        team?: { displayName?: string };
        injuries?: Array<{
          athlete?: { displayName?: string; position?: { abbreviation?: string } };
          status?: string;
          longComment?: string;
          shortComment?: string;
          date?: { date?: string };
        }>;
      }
      const injData = await injRes.json() as { items?: InjuryTeam[] };
      for (const team of injData.items ?? []) {
        const teamName = team.team?.displayName ?? 'Unknown';
        for (const inj of team.injuries ?? []) {
          if (!inj.status || inj.status === 'Active') continue;
          items.push({
            title: `${inj.athlete?.displayName ?? 'Unknown'} — ${inj.status}`,
            summary: `${teamName} ${inj.athlete?.position?.abbreviation ?? ''}: ${inj.longComment ?? inj.shortComment ?? inj.status}`,
            sport,
            type: 'injury',
            published: inj.date?.date ?? new Date().toISOString(),
          });
        }
      }
    }
  } catch { /* silent */ }

  return items;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { sport } = req.query;
  const sportFilter = typeof sport === 'string' && SPORTS.includes(sport as Sport)
    ? [sport as Sport]
    : SPORTS;

  const results = await Promise.all(sportFilter.map(s => fetchSportNews(s)));
  const all = results.flat().sort((a, b) =>
    new Date(b.published).getTime() - new Date(a.published).getTime()
  );

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json({ news: all });
}
