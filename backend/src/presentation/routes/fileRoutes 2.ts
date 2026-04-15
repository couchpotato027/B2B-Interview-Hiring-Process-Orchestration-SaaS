import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { uploadResumeMiddleware } from '../middleware/fileUploadMiddleware';
import { fileValidationMiddleware } from '../../infrastructure/middleware/FileValidationMiddleware';

const fileRouter = Router();
const controller = new FileController();

fileRouter.post(
  '/upload',
  uploadResumeMiddleware.single('file'), // Note: the field name from requirements is 'file'
  fileValidationMiddleware,
  (req, res, next) => controller.upload(req, res, next)
);

fileRouter.get(
  '/:id/download',
  (req, res, next) => controller.download(req, res, next)
);

fileRouter.get(
  '/:id/preview',
  (req, res, next) => controller.preview(req, res, next)
);

fileRouter.delete(
  '/:id',
  (req, res, next) => controller.delete(req, res, next)
);

export { fileRouter };
