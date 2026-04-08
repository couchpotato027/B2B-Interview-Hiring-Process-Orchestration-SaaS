import { AppError } from './app-error';

export class AIServiceError extends AppError {
  constructor(
    message: string,
    public readonly code: string = 'AI_SERVICE_ERROR',
    public readonly cause?: unknown,
  ) {
    super(message, 503, cause, code);
    this.name = 'AIServiceError';
  }
}
