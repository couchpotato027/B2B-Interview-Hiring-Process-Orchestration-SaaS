import { AnalyticsService } from '../services/AnalyticsService';
import { DashboardData } from '../../domain/types/Analytics';
import { cacheService } from '../../infrastructure/cache/CacheService';

export class GenerateHiringDashboardUseCase {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async execute(organizationId: string): Promise<DashboardData> {
    const cacheKey = `hiring_dashboard_${organizationId}`;
    const cached = cacheService.get<DashboardData>(cacheKey);
    if (cached) return cached;

    const metrics = await this.analyticsService.calculateHiringMetrics(organizationId);
    const velocity = await this.analyticsService.calculateHiringVelocity(organizationId);

    const dashboard: DashboardData = {
      summary: {
        totalCandidates: metrics.totalCandidates,
        activeApplications: metrics.activeCandidates,
        hiresThisMonth: 12, // Mock
        avgTimePerHire: metrics.avgTimeToHire,
      },
      velocity,
      recentActivity: [
        { type: 'CANDIDATE_ADDED', description: 'John Doe applied for Senior Engineer', timestamp: new Date() },
        { type: 'EVALUATION_COMPLETE', description: 'Eva scored 95/100 for Backend Dev', timestamp: new Date() },
        { type: 'STAGE_MOVE', description: 'Mike moved to Technical Interview', timestamp: new Date() }
      ],
      pipelineHealth: {
        totalPipelines: 5,
        avgCompletionRate: 78
      }
    };

    cacheService.set(cacheKey, dashboard, 3600); // 1 hour TTL
    return dashboard;
  }
}
