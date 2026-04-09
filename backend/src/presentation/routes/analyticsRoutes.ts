import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { Container } from '../../infrastructure/di/Container';

const analyticsRouter = Router();
const container = Container.getInstance();

const getController = () => {
  return new AnalyticsController(
    container.resolve('GenerateHiringDashboardUseCase'),
    container.resolve('GenerateJobReportUseCase'),
    container.resolve('ExportCandidateDataUseCase'),
    container.resolve('AnalyticsService')
  );
};

/**
 * @openapi
 * /analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get high-level hiring dashboard metrics
 *     responses:
 *       200:
 *         description: Dashboard data
 */
analyticsRouter.get('/dashboard', (req, res, next) => getController().getDashboard(req, res, next));

/**
 * @openapi
 * /analytics/job/{jobId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Get detailed analytics for a specific job
 *     parameters:
 *       - name: jobId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job report
 */
analyticsRouter.get('/job/:jobId', (req, res, next) => getController().getJobReport(req, res, next));

/**
 * @openapi
 * /analytics/funnel/{pipelineId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Get conversion funnel for a pipeline
 *     parameters:
 *       - name: pipelineId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Funnel data
 */
analyticsRouter.get('/funnel/:pipelineId', (req, res, next) => getController().getFunnel(req, res, next));

/**
 * @openapi
 * /analytics/skills:
 *   get:
 *     tags: [Analytics]
 *     summary: Get market skill supply and demand report
 *     responses:
 *       200:
 *         description: Skills report
 */
analyticsRouter.get('/skills', (req, res, next) => getController().getSkillsReport(req, res, next));

/**
 * @openapi
 * /analytics/export:
 *   post:
 *     tags: [Analytics]
 *     summary: Export candidate data as CSV
 *     responses:
 *       200:
 *         description: CSV file
 */
analyticsRouter.post('/export', (req, res, next) => getController().exportData(req, res, next));

export { analyticsRouter };
