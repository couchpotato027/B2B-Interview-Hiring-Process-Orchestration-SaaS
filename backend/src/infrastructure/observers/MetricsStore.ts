export interface DashboardMetrics {
  activeCandidatesCount: number;
  evaluationsCount: number;
}

export class MetricsStore {
  private static instance: MetricsStore | null = null;

  private metrics: DashboardMetrics = {
    activeCandidatesCount: 0,
    evaluationsCount: 0,
  };

  private constructor() {}

  public static getInstance(): MetricsStore {
    if (!MetricsStore.instance) {
      MetricsStore.instance = new MetricsStore();
    }

    return MetricsStore.instance;
  }

  public incrementActiveCandidates(): void {
    this.metrics.activeCandidatesCount += 1;
  }

  public incrementEvaluations(): void {
    this.metrics.evaluationsCount += 1;
  }

  public getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }
}
