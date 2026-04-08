import type { HealthStatus } from '../../domain/entities/health-status.entity';
import { env } from '../../infrastructure/config/env';

export class GetHealthStatusUseCase {
  execute(): HealthStatus {
    return {
      service: 'hireflow-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: env.nodeEnv,
    };
  }
}
