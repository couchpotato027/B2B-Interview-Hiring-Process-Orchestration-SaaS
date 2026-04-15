import cron from 'node-cron';
import { GenerateHiringDashboardUseCase } from '../../application/use-cases/GenerateHiringDashboardUseCase';
import { AnalyticsService } from '../../application/services/AnalyticsService';
import { logger } from '../logging/logger';

export class ScheduledAnalyticsService {
  constructor(
    private readonly dashboardUseCase: GenerateHiringDashboardUseCase,
    private readonly analyticsService: AnalyticsService
  ) {}

  public start(): void {
    logger.info('Initializing Scheduled Analytics Jobs');

    // Daily at 00:00: Refresh Dashboard Cache
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running Daily Dashboard Analytics Refresh');
      try {
        // In a real multi-tenant app, we would loop through all active organizations
        // For now, we use a placeholder to fix build signatures
        await this.dashboardUseCase.execute('global-refresh');
        logger.info('Daily Dashboard Analytics Refresh Complete');
      } catch (error) {
        logger.error({ err: error }, 'Daily Dashboard Analytics Refresh Failed');
      }
    });

    // Weekly on Sunday at 01:00: Calculate Trends
    cron.schedule('0 1 * * 0', async () => {
      logger.info('Running Weekly Trend Analysis');
      try {
        await this.analyticsService.calculateHiringVelocity('global-trends');
        logger.info('Weekly Trend Analysis Complete');
      } catch (error) {
        logger.error({ err: error }, 'Weekly Trend Analysis Failed');
      }
    });

    // Monthly on 1st at 02:00: Market Intelligence Summary
    cron.schedule('0 2 1 * *', async () => {
      logger.info('Running Monthly Market Intelligence Update');
      try {
        await this.analyticsService.generateSkillsReport('global-market');
        logger.info('Monthly Market Intelligence Update Complete');
      } catch (error) {
        logger.error({ err: error }, 'Monthly Market Intelligence Update Failed');
      }
    });

    logger.info('Scheduled Analytics Jobs Started Successfully');
  }
}
