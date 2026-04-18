export interface AppUser {
  id: string;
  email: string;
}

export type Sport = 'UFC' | 'MLB' | 'NFL';
export const SPORTS: Sport[] = ['UFC', 'MLB', 'NFL'];

export type Strategy = 'safe' | 'balanced' | 'aggressive';
export const STRATEGIES: Strategy[] = ['safe', 'balanced', 'aggressive'];

export type ParlayResult = 'pending' | 'win' | 'loss' | 'push' | 'partial';

export interface SportEvent {
  id: string;
  sport: Sport;
  title: string;
  commence_time: string;
  home_team: string | null;
  away_team: string | null;
  venue: string | null;
  odds_data: unknown;
  injuries_data: unknown;
  last_fetched_at: string | null;
}

export interface Pick {
  id: string;
  event_id: string;
  sport: Sport;
  pick_type: string;
  pick_category: string;
  pick_label: string;
  confidence: number;
  implied_probability: number | null;
  edge: number | null;
  odds: string | null;
  reasoning: string;
  factors: Record<string, unknown>;
  event_title?: string;
  commence_time?: string;
  created_at: string;
}

export interface GeneratedParlay {
  id: string;
  strategy: Strategy;
  pick_ids: string[];
  picks: Pick[];
  combined_odds: string;
  combined_implied_prob: number | null;
  confidence_avg: number;
  reasoning: string;
  result: ParlayResult;
  actual_payout: number | null;
  wager_amount: number | null;
  settled_at: string | null;
  leg_results: Record<string, string> | null;
  created_at: string;
}

export interface PerformanceStats {
  overall: Array<{ result: string; cnt: number }>;
  byStrategy: Array<{ strategy: string; result: string; cnt: number; avg_conf: number }>;
  byPickType: Array<{ sport: string; pick_type: string; pick_category: string; result: string; cnt: number; avg_conf: number }>;
  insights: Array<{
    sport: string;
    pick_type: string;
    pick_category: string;
    insight: string;
    win_rate: number;
    sample_size: number;
    recommendation: string;
  }>;
}
