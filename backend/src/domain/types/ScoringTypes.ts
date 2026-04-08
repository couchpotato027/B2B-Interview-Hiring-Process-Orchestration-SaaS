export interface ScoreBreakdownItem {
  name: string;
  score: number;
  weight: number;
}

export interface ScoreBreakdown {
  strategies: ScoreBreakdownItem[];
  overallScore: number;
}
