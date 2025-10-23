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

/**
 * JWT signing and verification using Bun's built-in methods
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
    const payload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    // Calculate expiration time
    const expiresIn = env.JWT_EXPIRES_IN;
    const expirationMs = this.parseExpiresIn(expiresIn);
    const exp = Math.floor((Date.now() + expirationMs) / 1000);

    const fullPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp,
      iss: JWT_CONFIG.ISSUER,
      aud: JWT_CONFIG.AUDIENCE,
    };

    // For simplicity, we'll use a basic JWT implementation
    // In production, consider using a JWT library
    return this.createJwt(fullPayload);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      const payload = this.verifyJwt(token);

      // Validate required fields
      if (!payload.userId || !payload.tenantId || !payload.email || !payload.role) {
        throw new UnauthorizedError('Invalid token payload');
      }

      return payload as JwtPayload;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid token');
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
      },
    };
  }

  /**
   * Create a simple JWT (basic implementation)
   */
  private createJwt(payload: any): string {
    const header = {
      alg: JWT_CONFIG.ALGORITHM,
      typ: 'JWT',
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify a JWT
   */
  private verifyJwt(token: string): any {
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedError('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);

    if (signature !== expectedSignature) {
      throw new UnauthorizedError('Invalid token signature');
    }

    // Decode payload
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedError('Token has expired');
    }

    return payload;
  }

  /**
   * Sign data with secret
   */
  private sign(data: string): string {
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(data + env.JWT_SECRET);
    return this.base64UrlEncode(hasher.digest('base64'));
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * Parse expires-in string to milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 7 days
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || 1000);
  }
}
