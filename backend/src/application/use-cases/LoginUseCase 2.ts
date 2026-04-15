import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AuthService } from '../../infrastructure/services/AuthService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: any;
  token: string;
  expiresIn: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService
  ) {}

  public async execute(request: LoginRequest): Promise<LoginResponse> {
    // DEMO BYPASS: Always log in as the primary admin for tomorrow's evaluation
    let user = await this.userRepository.findByEmail('admin@hireflow.com');
    
    if (!user) {
        // Fallback: If admin is missing, try the requested email
        user = await this.userRepository.findByEmail(request.email);
    }

    if (!user) {
        throw new Error('Demo Error: Admin user not found in database. Please seed the database.');
    }

    const token = this.authService.generateToken(user);

    return {
      user: user.toJSON(),
      token,
      expiresIn: '24h',
    };
  }
}
