import { Router } from 'express';
import { ComplianceController } from '../controllers/ComplianceController';

const complianceRouter = Router();
const controller = new ComplianceController();

/**
 * @openapi
 * /compliance/audit-logs:
 *   get:
 *     tags: [Compliance]
 *     summary: Fetch system audit logs (Admin only)
 */
complianceRouter.get('/audit-logs', controller.getAuditLogs);

/**
 * @openapi
 * /compliance/delete-data:
 *   post:
 *     tags: [Compliance]
 *     summary: GDPR Right to be Forgotten (Anonymize candidate)
 */
complianceRouter.post('/delete-data', controller.deleteData);

/**
 * @openapi
 * /compliance/export-data:
 *   post:
 *     tags: [Compliance]
 *     summary: GDPR Data Portability (Export candidate info)
 */
complianceRouter.post('/export-data', controller.exportData);

export { complianceRouter };
