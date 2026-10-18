import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Owner, Session } from '@prisma/client';
import type { Request } from 'express';
import { AuthService, SESSION_COOKIE } from './auth.service.js';

type RequestWithOwner = Request & {
  owner?: Owner;
  session?: Session;
};

@Injectable()
export class OwnerAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithOwner>();
    const sessionToken = this.readCookie(request.headers.cookie, SESSION_COOKIE);
    const session = await this.authService.authenticateToken(sessionToken);

    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    request.owner = session.owner;
    request.session = session;

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      this.assertSameOrigin(request);
    }

    return true;
  }

  private readCookie(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader) {
      return undefined;
    }

    for (const part of cookieHeader.split(';')) {
      const [key, ...value] = part.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value.join('='));
      }
    }

    return undefined;
  }

  private assertSameOrigin(request: RequestWithOwner): void {
    const origin = request.headers.origin;

    if (!origin) {
      throw new ForbiddenException('Origin header required');
    }

    try {
      const originUrl = new URL(origin);
      const requestHost = request.headers.host ?? '';
      const originHost = originUrl.hostname;
      const expectedHost = requestHost.split(':')[0];

      if (originHost !== expectedHost) {
        throw new ForbiddenException('Invalid request origin');
      }
    } catch {
      throw new ForbiddenException('Invalid request origin');
    }
  }
}
