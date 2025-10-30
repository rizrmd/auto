/**
 * Super Admin Authentication Service
 *
 * Handles JWT generation, verification, and authentication for Super Admin users.
 * Uses separate authentication system from tenant admins.
 */

import { prisma } from '../db';
import type { SuperAdmin } from '../../../generated/prisma';
import { env } from '../config/env';
import type { SuperAdminLoginResponse, SuperAdminJwtPayload } from '../types/super-admin';
import { UnauthorizedError } from '../middleware/error-handler';
import jwt from 'jsonwebtoken';

/**
 * Super Admin JWT signing and verification
 */
export class SuperAdminAuthService {
  /**
   * Hash a password using Bun.password
   */
  async hashPassword(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 12, // Higher cost for Super Admin accounts
    });
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(password, hash);
  }

  /**
   * Generate JWT token for Super Admin
   */
  generateToken(superAdmin: SuperAdmin): string {
    const payload: SuperAdminJwtPayload = {
      superAdminId: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    };

    return jwt.sign(payload, env.SUPER_ADMIN_JWT_SECRET || env.JWT_SECRET, {
      algorithm: 'HS256' as const,
      expiresIn: (env.SUPER_ADMIN_JWT_TTL || '24h') as any,
      issuer: 'autoleads-super-admin-api',
      audience: 'autoleads-super-admin-client',
      subject: superAdmin.id.toString(),
    });
  }

  /**
   * Generate refresh token for Super Admin
   */
  generateRefreshToken(superAdmin: SuperAdmin): string {
    const payload = {
      superAdminId: superAdmin.id,
      type: 'refresh',
    };

    return jwt.sign(payload, env.SUPER_ADMIN_JWT_SECRET || env.JWT_SECRET, {
      algorithm: 'HS256' as const,
      expiresIn: '7d',
      issuer: 'autoleads-super-admin-api',
      audience: 'autoleads-super-admin-client',
      subject: superAdmin.id.toString(),
    });
  }

  /**
   * Verify JWT token for Super Admin
   */
  verifyToken(token: string): SuperAdminJwtPayload {
    try {
      const decoded = jwt.verify(token, env.SUPER_ADMIN_JWT_SECRET || env.JWT_SECRET, {
        algorithms: ['HS256'],  // Prevent algorithm confusion
        issuer: 'autoleads-super-admin-api',
        audience: 'autoleads-super-admin-client',
      });

      // Type guard
      if (typeof decoded === 'string') {
        throw new UnauthorizedError('Invalid token format');
      }

      return decoded as SuperAdminJwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Super Admin token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid Super Admin token');
      }
      throw new UnauthorizedError('Super Admin token verification failed');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): { superAdminId: number } {
    try {
      const decoded = jwt.verify(token, env.SUPER_ADMIN_JWT_SECRET || env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'autoleads-super-admin-api',
        audience: 'autoleads-super-admin-client',
      });

      if (typeof decoded === 'string') {
        throw new UnauthorizedError('Invalid refresh token format');
      }

      const payload = decoded as any;
      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token type');
      }

      return { superAdminId: payload.superAdminId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw new UnauthorizedError('Refresh token verification failed');
    }
  }

  /**
   * Authenticate Super Admin with email and password
   */
  async authenticate(
    email: string,
    password: string
  ): Promise<SuperAdminLoginResponse> {
    // Find Super Admin by email
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!superAdmin) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, superAdmin.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if Super Admin is active
    if (superAdmin.status !== 'active') {
      throw new UnauthorizedError('Super Admin account is inactive');
    }

    // Update last login
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const token = this.generateToken(superAdmin);
    const refreshToken = this.generateRefreshToken(superAdmin);

    return {
      token,
      refreshToken,
      expiresIn: env.SUPER_ADMIN_JWT_TTL || '24h',
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        status: superAdmin.status,
        lastLoginAt: superAdmin.lastLoginAt,
        createdAt: superAdmin.createdAt,
      },
    };
  }

  /**
   * Refresh Super Admin tokens
   */
  async refreshTokens(refreshToken: string): Promise<SuperAdminLoginResponse> {
    // Verify refresh token
    const { superAdminId } = this.verifyRefreshToken(refreshToken);

    // Get Super Admin from database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
    });

    if (!superAdmin) {
      throw new UnauthorizedError('Super Admin not found');
    }

    // Check if Super Admin is still active
    if (superAdmin.status !== 'active') {
      throw new UnauthorizedError('Super Admin account is inactive');
    }

    // Generate new tokens
    const token = this.generateToken(superAdmin);
    const newRefreshToken = this.generateRefreshToken(superAdmin);

    return {
      token,
      refreshToken: newRefreshToken,
      expiresIn: env.SUPER_ADMIN_JWT_TTL || '24h',
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        status: superAdmin.status,
        lastLoginAt: superAdmin.lastLoginAt,
        createdAt: superAdmin.createdAt,
      },
    };
  }

  /**
   * Create initial Super Admin (for system setup)
   */
  async createSuperAdmin(data: {
    name: string;
    email: string;
    password: string;
    role?: 'super_admin' | 'support';
  }): Promise<SuperAdmin> {
    const { name, email, password, role = 'super_admin' } = data;

    // Check if Super Admin already exists
    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      throw new Error('Super Admin with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create Super Admin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        status: 'active',
      },
    });

    // Log the creation
    console.log(`[SUPER_ADMIN_CREATED] ${superAdmin.email} (${superAdmin.role})`);

    return superAdmin;
  }

  /**
   * Update Super Admin password
   */
  async updatePassword(superAdminId: number, currentPassword: string, newPassword: string): Promise<void> {
    // Get Super Admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
    });

    if (!superAdmin) {
      throw new Error('Super Admin not found');
    }

    // Verify current password
    const isValid = await this.verifyPassword(currentPassword, superAdmin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await prisma.superAdmin.update({
      where: { id: superAdminId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // Log the password change
    console.log(`[SUPER_ADMIN_PASSWORD_CHANGED] ${superAdmin.email}`);
  }

  /**
   * Validate Super Admin session
   */
  async validateSession(superAdminId: number): Promise<boolean> {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
      select: { status: true },
    });

    return superAdmin?.status === 'active';
  }
}