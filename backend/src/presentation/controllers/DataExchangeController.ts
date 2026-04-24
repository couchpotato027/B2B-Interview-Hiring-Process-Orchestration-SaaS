import { Request, Response } from 'express';
import { DataExchangeService } from '../../infrastructure/services/DataExchangeService';
import { PrismaCandidateRepository } from '../../infrastructure/repositories/PrismaCandidateRepository';

// Initialize dependencies
const candidateRepository = new PrismaCandidateRepository();
const exchangeService = new DataExchangeService(candidateRepository);

export const exportCandidates = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const format = (req.query.format as 'csv' | 'json') || 'csv';
    const filters = req.body.filters || {};
    const organizationId = user.tenantId || user.organizationId;

    // Support RLS for non-admins if needed
    if (user.role === 'INTERVIEWER' || user.role === 'HIRING_MANAGER') {
        filters.assignedToUserId = user.id;
    }

    const { data, contentType } = await exchangeService.exportCandidates(filters, organizationId, format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=candidates_${Date.now()}.${format}`);
    return res.send(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const importCandidates = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }

        const organizationId = user.tenantId || user.organizationId;
        const result = await exchangeService.importCandidates(req.file.buffer, organizationId);
        return res.json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

export const downloadTemplate = async (req: Request, res: Response) => {
    const template = exchangeService.getImportTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_template.csv');
    return res.send(template);
};
