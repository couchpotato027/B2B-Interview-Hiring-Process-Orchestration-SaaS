import multer from 'multer';
import { ValidationError } from '../../shared/errors/ValidationError';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  const lowerName = file.originalname.toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !hasAllowedExtension) {
    callback(new ValidationError('Only PDF, DOCX, and TXT resume files are allowed.'));
    return;
  }

  callback(null, true);
};

export const uploadResumeMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter,
});
