import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface ChangePasswordRequest {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(request: ChangePasswordRequest): Promise<void> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isOldPasswordValid = await user.validatePassword(request.oldPassword);
    if (!isOldPasswordValid) {
      throw new Error('Invalid old password');
    }

    await user.updatePassword(request.newPassword);
    await this.userRepository.save(user);
  }
}
