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

export interface RecruiterMetrics {
  recruiterId: string;
  evaluationsCompleted: number;
  avgTimeToEvaluate: number;
  successfulHires: number;
}

export interface DashboardData {
  summary: {
    totalCandidates: number;
    activeApplications: number;
    hiresThisMonth: number;
    avgTimePerHire: number;
  };
  velocity: VelocityMetrics;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  pipelineHealth: {
    totalPipelines: number;
    avgCompletionRate: number;
  };
}
