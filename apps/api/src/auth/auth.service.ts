import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Owner, Session } from '@prisma/client';
import argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

export const SESSION_COOKIE = 'bewerbungsmanager_session';

export type AuthOwner = Pick<Owner, 'id' | 'email' | 'createdAt' | 'updatedAt'>;
export type AuthSession = Session & { owner: Owner };

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async bootstrapOwner(
    email: string,
    password: string,
    bootstrapSecret: string,
  ): Promise<AuthOwner> {
    const expectedSecret = process.env.OWNER_BOOTSTRAP_SECRET;

    if (!expectedSecret) {
      throw new ServiceUnavailableException('Owner bootstrap is not configured');
    }

    if (!this.safeEqual(bootstrapSecret, expectedSecret)) {
      throw new UnauthorizedException('Invalid bootstrap secret');
    }

    const ownerCount = await this.prisma.owner.count();
    if (ownerCount > 0) {
      throw new ConflictException('Owner already initialized');
    }

    const passwordHash = await this.hashPassword(password);
    const owner = await this.prisma.owner.create({
      data: { email, passwordHash },
    });

    return this.toAuthOwner(owner);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ owner: AuthOwner; sessionToken: string }> {
    const owner = await this.prisma.owner.findUnique({ where: { email } });

    if (!owner || !(await argon2.verify(owner.passwordHash, password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(sessionToken);

    await this.prisma.session.create({
      data: {
        tokenHash,
        ownerId: owner.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      owner: this.toAuthOwner(owner),
      sessionToken,
    };
  }

  async authenticateToken(sessionToken: string | undefined): Promise<AuthSession | null> {
    if (!sessionToken) {
      return null;
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(sessionToken) },
      include: { owner: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return null;
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return session;
  }

  async revokeToken(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) {
      return;
    }

    await this.prisma.session.updateMany({
      where: {
        tokenHash: this.hashToken(sessionToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private toAuthOwner(owner: Owner): AuthOwner {
    return {
      id: owner.id,
      email: owner.email,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }
}
