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

export const listPipelines = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pipelineService.listPipelines(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getPipeline = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pipelineService.getPipeline(req.user!.tenantId, req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updatePipeline = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pipelineService.updatePipeline(req.user!.tenantId, req.params.id as string, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const deletePipeline = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pipelineService.deletePipeline(req.user!.tenantId, req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const reorderStages = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pipelineService.reorderStages(req.user!.tenantId, req.params.id as string, req.body.stageOrder);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const addStage = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pipelineService.addStage(req.user!.tenantId, req.params.id as string, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteStage = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pipelineService.deleteStage(req.user!.tenantId, req.params.stageId as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
