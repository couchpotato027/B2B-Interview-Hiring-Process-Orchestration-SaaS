import type { Request, Response } from 'express';
import { GetHealthStatusUseCase } from '../../application/use-cases/get-health-status.use-case';

const getHealthStatusUseCase = new GetHealthStatusUseCase();

export class HealthController {
  getHealth(_req: Request, res: Response): void {
    const healthStatus = getHealthStatusUseCase.execute();

    res.status(200).json(healthStatus);
  }
}

export const healthController = new HealthController();
