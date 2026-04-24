export interface TrendResult {
  label: string;
  value: number;
}

export interface MetricWithTrend {
  value: number;
  trend: number;
  isPositive: boolean;
}

export interface DashboardMetrics {
  activeCandidates: MetricWithTrend;
  timeToHire: {
    avgDays: number;
    trend: number;
    isPositive: boolean;
  };
  slaBreaches: {
    count: number;
    message: string;
  };
  offersAccepted: {
    count: number;
    total: number;
    rate: number;
  };
}

export interface HiringMetrics {
  totalCandidates: number;
  activeCandidates: number;
  totalEvaluations: number;
  avgTimeToHire: number;
  avgTimePerStage: Record<string, number>;
  offerAcceptanceRate: number;
  topSources: Array<{ source: string; count: number }>;
  skillGaps: Array<{ skill: string; demandCount: number; supplyCount: number }>;
}

export interface VelocityMetrics {
  candidatesAdded: Array<{ label: string; value: number }>;
  evaluationsCompleted: Array<{ label: string; value: number }>;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FunnelData {
  pipelineId: string;
  stages: Array<{
    stageId: string;
    stageName: string;
    candidateCount: number;
    conversionRate: number;
    dropOffPercent: number;
  }>;
  totalConversionRate: number;
  bottleneckStageId?: string;
}

export interface SkillsReport {
  mostInDemand: string[];
  highestSupply: string[];
  criticalSkillGaps: string[];
}
