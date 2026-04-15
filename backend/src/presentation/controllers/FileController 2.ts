import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { UploadResumeFileUseCase } from '../../application/use-cases/UploadResumeFileUseCase';
import { DownloadResumeUseCase } from '../../application/use-cases/DownloadResumeUseCase';
import { DeleteResumeFileUseCase } from '../../application/use-cases/DeleteResumeFileUseCase';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

export class FileController extends BaseController {
  private readonly container = Container.getInstance();
  private get uploadUseCase() {
    return Container.getInstance().resolve<UploadResumeFileUseCase>('UploadResumeFileUseCase');
  }
  private get downloadUseCase() {
    return Container.getInstance().resolve<DownloadResumeUseCase>('DownloadResumeUseCase');
  }
  private get deleteUseCase() {
    return Container.getInstance().resolve<DeleteResumeFileUseCase>('DeleteResumeFileUseCase');
  }

  constructor() {
    super();
  }

  public upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        this.badRequest(res, 'No file uploaded.', 'MISSING_FILE');
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);
      const userId = authReq.user?.userId || 'anonymous';

      if (!organizationId) {
        this.badRequest(res, 'Organization ID is required.', 'MISSING_ORGANIZATION_ID');
        return;
      }

      const result = await this.uploadUseCase.execute({
        file: req.file.buffer,
        fileName: req.file.originalname,
        uploadedBy: userId,
        organizationId,
      });

      if (!result.success) {
        this.badRequest(res, result.error, result.code);
        return;
      }

      this.created(res, result.data);
    } catch (error) {
      next(error);
    }
  };

  public download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      if (!organizationId) {
        this.badRequest(res, 'Organization ID is required.', 'MISSING_ORGANIZATION_ID');
        return;
      }

      const result = await this.downloadUseCase.execute({
        fileId: req.params.id as string,
        organizationId,
      });

      if (!result.success) {
        this.notFound(res, result.error, result.code);
        return;
      }

      this.ok(res, result.data);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      if (!organizationId) {
        this.badRequest(res, 'Organization ID is required.', 'MISSING_ORGANIZATION_ID');
        return;
      }

      const result = await this.deleteUseCase.execute({
        fileId: req.params.id as string,
        organizationId,
      });

      if (!result.success) {
        this.notFound(res, result.error, result.code);
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public preview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // For preview, we currently use the same logic as download (returns signed URL)
    return this.download(req, res, next);
  };
}
