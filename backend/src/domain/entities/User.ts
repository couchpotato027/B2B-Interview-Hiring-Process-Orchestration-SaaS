import { Role } from '../types/Role';
import bcrypt from 'bcryptjs';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
}

export class User {
  private readonly id: string;
  private readonly email: string;
  private passwordHash: string;
  private name: string;
  private role: Role;
  private readonly organizationId: string;
  private isActive: boolean;
  private readonly createdAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.name = props.name;
    this.role = props.role;
    this.organizationId = props.organizationId;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  public getId(): string {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getName(): string {
    return this.name;
  }

  public getRole(): Role {
    return this.role;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  public async updatePassword(newPassword: string): Promise<void> {
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(newPassword, saltRounds);
  }

  public setRole(role: Role): void {
    this.role = role;
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      organizationId: this.organizationId,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }
}
