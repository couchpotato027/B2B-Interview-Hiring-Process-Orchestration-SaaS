import { Role } from '../../domain/types/Role';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AuthService } from '../../infrastructure/services/AuthService';
import { randomUUID } from 'crypto';

export interface RegisterUserRequest {
  email: string;
  password: string;
  name: string;
  role: Role;
  organizationId: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService
  ) {}

  public async execute(request: RegisterUserRequest): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await this.authService.hashPassword(request.password);

    const user = new User({
      id: randomUUID(),
      email: request.email,
      passwordHash,
      name: request.name,
      role: request.role,
      organizationId: request.organizationId,
      isActive: true,
      createdAt: new Date(),
    });

    await this.userRepository.save(user);

    return user;
  }
}
