import { AppError } from './app-error';

export class AIServiceError extends AppError {
  constructor(
    message: string,
    code: string = 'AI_SERVICE_ERROR',
    cause?: unknown,
  ) {
    super(message, 503, code, cause);
    this.name = 'AIServiceError';
  }
}
