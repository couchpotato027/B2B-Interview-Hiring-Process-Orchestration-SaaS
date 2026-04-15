import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/User';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiry: string = '24h';

  constructor(secret: string = env.jwtSecret || 'default_secret') {
    this.jwtSecret = secret;
  }

  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
      organizationId: user.getOrganizationId(),
    };

    return jwt.sign(payload, this.jwtSecret as string, { expiresIn: this.jwtExpiry as any });
  }

  public verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  public refreshToken(token: string): string {
    try {
      const payload = jwt.verify(token, this.jwtSecret, { ignoreExpiration: true }) as TokenPayload;
      // In a real app, we'd check against a refresh token in the database
      // For this implementation, we just sign a new one if it's not a blacklisted token
      return jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          organizationId: payload.organizationId,
        },
        this.jwtSecret as string,
        { expiresIn: this.jwtExpiry as any }
      );
    } catch (error) {
      throw new Error('Could not refresh token');
    }
  }
}
