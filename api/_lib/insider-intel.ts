import Anthropic from '@anthropic-ai/sdk';
import type { Sport } from './sports-data';

const client = new Anthropic();

export interface InsiderIntel {
  sport: Sport;
  event_title: string;
  sharp_money_direction: string | null;
  public_betting_pct: string | null;
  notable_picks: Array<{
    source: string;
    pick: string;
    reasoning: string;
  }>;
  line_movement: string | null;
  insider_notes: string[];
}

const INSIDER_SOURCES: Record<Sport, string> = {
  UFC: `Known sharp UFC bettors and analysts to consider:
- MMA betting Twitter/X accounts with verified track records
- UFC insider reporters (Ariel Helwani, Brett Okamoto, etc.)
- Fighter camp reports and training footage analysis
- Weigh-in observations (missed weight, look/demeanor)
- Betting line movement from opening to current
- Reverse line movement (line moves opposite of public betting %)
- Steam moves (sudden sharp line movements)`,

  MLB: `Known sharp MLB bettors and analysts to consider:
- MLB betting Twitter/X accounts with verified track records
- Beat reporters for lineup/injury info before official announcements
- Bullpen usage tracking from beat writers
- Weather reporters for outdoor game impact
- Umpire assignment impact (home plate ump tendencies)
- Betting line movement from opening to current
- Reverse line movement patterns
- Late lineup changes and their impact`,

  NFL: `Known sharp NFL bettors and analysts to consider:
- NFL betting Twitter/X accounts with verified track records
- Beat reporters for injury updates not yet in official reports
- Practice report watchers (limited/full/DNP tracking)
- Weather forecasters for outdoor games
- Travel/scheduling disadvantage trackers
- Referee assignment tendencies
- Betting line movement from opening to current
- Key number analysis (3, 7, 10 in NFL spreads)
- Look-ahead line analysis`,
};

export async function gatherInsiderIntel(
  sport: Sport,
  eventTitle: string,
  oddsData: unknown
): Promise<InsiderIntel> {
  const prompt = `You are a sports betting intelligence analyst specializing in ${sport}. Analyze this event using your knowledge of sharp betting patterns, insider information sources, and public sentiment.

## Event
${eventTitle}

## Current Odds
${JSON.stringify(oddsData, null, 2)}

## Intelligence Sources to Consider
${INSIDER_SOURCES[sport]}

Based on your knowledge of how sharp bettors and insiders operate in ${sport}, analyze:

1. **Sharp Money Direction**: Which side are sharp bettors likely on? Look at line movement patterns. If the line moves against public betting percentage, that's sharp money.

2. **Public Betting**: Which side is the public likely heavy on? The public tends to bet favorites, overs, and popular names.

3. **Notable Handicapper Picks**: What would well-known sharp bettors likely pick? Consider their known tendencies and strategies.

4. **Line Movement Analysis**: How has this line likely moved from open to current? What does that movement tell us?

5. **Insider Notes**: Any non-obvious factors that sharp bettors would know:
   - Camp/training reports, injury nuances not in official reports
   - Motivation factors (contract year, rivalry, retirement fight)
   - Scheduling advantages/disadvantages
   - Historical patterns in similar situations

Respond with ONLY valid JSON:
{
  "sport": "${sport}",
  "event_title": "${eventTitle}",
  "sharp_money_direction": "Brief description of where sharp money appears to be",
  "public_betting_pct": "Brief description of public betting lean",
  "notable_picks": [
    {"source": "Sharp consensus", "pick": "The specific pick", "reasoning": "Why sharps like this"}
  ],
  "line_movement": "Description of line movement and what it signals",
  "insider_notes": ["Note 1", "Note 2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export function formatIntelForAnalysis(intel: InsiderIntel): string {
  let report = `## Insider Intelligence Report\n`;
  report += `**Sharp Money**: ${intel.sharp_money_direction ?? 'Unknown'}\n`;
  report += `**Public Lean**: ${intel.public_betting_pct ?? 'Unknown'}\n`;
  report += `**Line Movement**: ${intel.line_movement ?? 'Unknown'}\n\n`;

  if (intel.notable_picks.length > 0) {
    report += `### Sharp/Notable Picks\n`;
    for (const pick of intel.notable_picks) {
      report += `- [${pick.source}] ${pick.pick}: ${pick.reasoning}\n`;
    }
  }

  if (intel.insider_notes.length > 0) {
    report += `\n### Insider Notes\n`;
    for (const note of intel.insider_notes) {
      report += `- ${note}\n`;
    }
  }

  return report;
}
