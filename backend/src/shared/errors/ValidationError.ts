import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
