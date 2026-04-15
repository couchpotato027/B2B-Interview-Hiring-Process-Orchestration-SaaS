import { AuthService } from '../../infrastructure/services/AuthService';

export class RefreshTokenUseCase {
  constructor(private readonly authService: AuthService) {}

  public async execute(token: string): Promise<{ token: string }> {
    const newToken = this.authService.refreshToken(token);
    return { token: newToken };
  }
}
