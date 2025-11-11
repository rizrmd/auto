/**
 * Authentication Service
 *
 * Handles JWT generation, verification, and password hashing.
 */

import { prisma } from '../db';
import type { User } from '../../../generated/prisma';
import { env } from '../config/env';
import { JWT_CONFIG } from '../config/constants';
import type { JwtPayload, LoginResponse } from '../types/context';
import { UnauthorizedError } from '../middleware/error-handler';
import jwt from 'jsonwebtoken';

/**
 * JWT signing and verification using industry-standard jsonwebtoken library
 */
export class AuthService {
  /**
   * Hash a password using Bun.password
   */
  async hashPassword(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 10,
    });
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: 'HS256' as const,
      expiresIn: (env.JWT_EXPIRES_IN || '7d') as any,
      issuer: 'autoleads-api',
      audience: 'autoleads-client',
      subject: user.id.toString(),
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],  // Prevent algorithm confusion
        issuer: 'autoleads-api',
        audience: 'autoleads-client',
      });

      // Type guard
      if (typeof decoded === 'string') {
        throw new UnauthorizedError('Invalid token format');
      }

      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(
    email: string,
    password: string,
    tenantId?: number
  ): Promise<LoginResponse> {
    // Find user by email (and optionally tenant)
    const where: any = { email };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const user = await prisma.user.findFirst({
      where,
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is inactive');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        subdomain: user.tenant.subdomain,
        customDomain: user.tenant.customDomain,
        whatsappNumber: user.tenant.whatsappNumber,
        whatsappBotEnabled: user.tenant.whatsappBotEnabled,
      },
    };
  }
}
