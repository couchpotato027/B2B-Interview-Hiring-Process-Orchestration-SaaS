import { PrismaClient } from '@prisma/client';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Role } from '../../domain/types/Role';
import { prisma } from '../database/prisma.client';

export class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<User | null> {
    const userModel = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!userModel) return null;

    return this.mapToEntity(userModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    // Find all users with this email and prefer the default-tenant user
    const userModels = await this.prisma.user.findMany({
      where: { email },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userModels.length === 0) return null;

    // Prefer users in 'default-tenant' over other tenants
    const preferred = userModels.find(u => u.tenantId === 'default-tenant') || userModels[0];
    return this.mapToEntity(preferred);
  }

  async save(user: User): Promise<void> {
    const firstName = user.getName().split(' ')[0] || '';
    const lastName = user.getName().split(' ').slice(1).join(' ') || '';

    const role = await this.prisma.role.findFirst({
      where: { 
        tenantId: user.getOrganizationId(),
        name: user.getRole()
      }
    });

    if (!role) {
      throw new Error(`Role ${user.getRole()} not found for organization ${user.getOrganizationId()}`);
    }

    const data = {
      email: user.getEmail(),
      firstName,
      lastName,
      tenantId: user.getOrganizationId(),
      roleId: role.id,
      passwordHash: user.getPasswordHash() || 'WILL_BE_SET'
    };

    await this.prisma.user.upsert({
      where: { id: user.getId() },
      create: {
        id: user.getId(),
        ...data
      },
      update: data,
    });
  }

  async findAll(): Promise<User[]> {
    const userModels = await this.prisma.user.findMany({
      include: { role: true },
    });
    return userModels.map(m => this.mapToEntity(m));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private mapToEntity(model: any): User {
    return new User({
      id: model.id,
      email: model.email,
      passwordHash: model.passwordHash,
      name: `${model.firstName} ${model.lastName}`.trim(),
      role: model.role?.name as Role,
      organizationId: model.tenantId,
      isActive: true,
      createdAt: model.createdAt,
    });
  }
}
