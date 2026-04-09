import { AnalyticsService } from '../services/AnalyticsService';
import { DashboardData } from '../../domain/types/Analytics';
import { cacheService } from '../../infrastructure/cache/CacheService';

export class GenerateHiringDashboardUseCase {
  private readonly CACHE_KEY = 'hiring_dashboard_metrics';

  constructor(private readonly analyticsService: AnalyticsService) {}

  async execute(): Promise<DashboardData> {
    const cached = cacheService.get<DashboardData>(this.CACHE_KEY);
    if (cached) return cached;

    const metrics = await this.analyticsService.calculateHiringMetrics();
    const velocity = await this.analyticsService.calculateHiringVelocity();

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

    cacheService.set(this.CACHE_KEY, dashboard, 3600); // 1 hour TTL
    return dashboard;
  }
}
