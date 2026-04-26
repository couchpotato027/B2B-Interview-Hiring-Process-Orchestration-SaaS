import { Request, Response, NextFunction } from 'express';
import { CreatePipelineUseCase } from '../../application/use-cases/CreatePipelineUseCase';
import { MoveCandidateThroughPipelineUseCase } from '../../application/use-cases/MoveCandidateThroughPipelineUseCase';
import { GetPipelineBoardUseCase } from '../../application/use-cases/GetPipelineBoardUseCase';
import { BulkMoveCandidatesUseCase } from '../../application/use-cases/BulkMoveCandidatesUseCase';
import { GetPipelinesUseCase } from '../../application/use-cases/GetPipelinesUseCase';
import { PipelineTemplates } from '../../domain/templates/PipelineTemplates';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { BaseController } from './BaseController';

export class PipelineController extends BaseController {
  constructor(
    private readonly createPipelineUseCase: CreatePipelineUseCase,
    private readonly moveCandidateUseCase: MoveCandidateThroughPipelineUseCase,
    private readonly getPipelineBoardUseCase: GetPipelineBoardUseCase,
    private readonly bulkMoveUseCase: BulkMoveCandidatesUseCase,
    private readonly getPipelinesUseCase: GetPipelinesUseCase
  ) {
    super();
  }

  async listPipelines(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';

      const pipelines = await this.getPipelinesUseCase.execute(organizationId);
      return this.rawOk(res, pipelines);
    } catch (error) {
      return next(error);
    }
  }

  async createPipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';

      const pipeline = await this.createPipelineUseCase.execute({
        ...req.body,
        organizationId
      });
      return res.status(201).json(pipeline);
    } catch (error) {
      return next(error);
    }
  }

  async getBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';

      const boardData = await this.getPipelineBoardUseCase.execute(id as string, organizationId);
      
      // Transform into frontend format
      const stages = boardData.stages.map(s => ({
        id: s.stageId,
        name: s.stageName
      }));

      const candidates = boardData.stages.flatMap(s => 
        s.candidates.map(c => {
          const nameParts = c.name.split(' ');
            return {
              id: c.id,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: c.email,
              currentStageId: s.stageId,
              score: c.score,
              assignedRecruiter: c.assignedRecruiter
            };
        })
      );

      return this.rawOk(res, {
        id: boardData.pipeline.getId(),
        name: boardData.pipeline.getName(),
        stages,
        candidates
      });
    } catch (error) {
      return next(error);
    }
  }

  async moveCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // candidateId
      const { pipelineId, newStageId, reason, notes } = req.body;
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';
      const movedBy = authReq.user?.email || 'admin@hireflow.com';

      const status = await this.moveCandidateUseCase.execute({
        candidateId: id as string,
        pipelineId,
        newStageId,
        organizationId,
        movedBy,
        reason,
        notes,
      });

      return this.rawOk(res, status);
    } catch (error) {
      return next(error);
    }
  }

  async bulkMove(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateIds, pipelineId, newStageId, reason } = req.body;
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';
      const movedBy = authReq.user?.email || 'admin@hireflow.com';

      const results = await this.bulkMoveUseCase.execute({
        candidateIds,
        pipelineId,
        newStageId,
        organizationId,
        movedBy,
        reason
      });

      return this.rawOk(res, results);
    } catch (error) {
      return next(error);
    }
  }

  async getStages(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';

      const boardData = await this.getPipelineBoardUseCase.execute(id as string, organizationId);
      const stages = boardData.stages.map(s => ({
        id: s.stageId,
        name: s.stageName,
        order: s.orderIndex
      }));

      return this.rawOk(res, stages);
    } catch (error) {
      return next(error);
    }
  }

  getTemplates(req: Request, res: Response) {
    return this.rawOk(res, PipelineTemplates.getAll());
  }
}
