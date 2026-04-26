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
    const { email, password } = request;

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    // Find user by the actual requested email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.getIsActive()) {
      throw new Error('Your account has been deactivated. Please contact your administrator.');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    const token = this.authService.generateToken(user);

    return {
      user: user.toJSON(),
      token,
      expiresIn: '24h',
    };
  }
}
