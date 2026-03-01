import { Response, NextFunction } from 'express';
import { PipelineService } from './pipeline.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const pipelineService = new PipelineService();

export const createPipeline = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const { name, roleType, stages } = req.body;

        const result = await pipelineService.createPipelineTemplate(tenantId, name, roleType, stages);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};
