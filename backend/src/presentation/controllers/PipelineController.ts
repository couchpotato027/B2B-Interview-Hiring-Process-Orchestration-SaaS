import { Request, Response, NextFunction } from 'express';
import { CreatePipelineUseCase } from '../../application/use-cases/CreatePipelineUseCase';
import { MoveCandidateThroughPipelineUseCase } from '../../application/use-cases/MoveCandidateThroughPipelineUseCase';
import { GetPipelineBoardUseCase } from '../../application/use-cases/GetPipelineBoardUseCase';
import { BulkMoveCandidatesUseCase } from '../../application/use-cases/BulkMoveCandidatesUseCase';
import { PipelineTemplates } from '../../domain/templates/PipelineTemplates';

export class PipelineController {
  constructor(
    private readonly createPipelineUseCase: CreatePipelineUseCase,
    private readonly moveCandidateUseCase: MoveCandidateThroughPipelineUseCase,
    private readonly getPipelineBoardUseCase: GetPipelineBoardUseCase,
    private readonly bulkMoveUseCase: BulkMoveCandidatesUseCase
  ) {}

  async createPipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const pipeline = await this.createPipelineUseCase.execute(req.body);
      res.status(201).json({ success: true, data: pipeline });
    } catch (error) {
      next(error);
    }
  }

  async getBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const board = await this.getPipelineBoardUseCase.execute(id as string);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  async moveCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // candidateId
      const { pipelineId, newStageId, reason, notes } = req.body;
      const movedBy = (req as any).user?.email || 'system';

      const status = await this.moveCandidateUseCase.execute({
        candidateId: id as string,
        pipelineId,
        newStageId,
        movedBy,
        reason,
        notes,
      });

      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async bulkMove(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateIds, pipelineId, newStageId, reason } = req.body;
      const movedBy = (req as any).user?.email || 'system';

      const result = await this.bulkMoveUseCase.execute({
        candidateIds,
        pipelineId,
        newStageId,
        movedBy,
        reason,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  getTemplates(req: Request, res: Response) {
    res.status(200).json({ success: true, data: PipelineTemplates.getAll() });
  }
}
