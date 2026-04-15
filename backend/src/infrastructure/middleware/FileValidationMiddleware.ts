import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/ValidationError';

export const fileValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new ValidationError('No file uploaded.'));
  }

  // 1. Validate size (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (req.file.size > MAX_SIZE) {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds 10MB limit.',
      code: 'FILE_TOO_LARGE',
    });
  }

  // 2. Validate MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only PDF, DOCX, and TXT are allowed.',
      code: 'INVALID_FILE_TYPE',
    });
  }

  // 3. Placeholder for Virus Scanning
  // In a real app, we would pipe the buffer to a scanner like ClamAV here
  console.log(`[FileValidation] Scanning file: ${req.file.originalname} (Safe - Placeholder)`);

  next();
};
