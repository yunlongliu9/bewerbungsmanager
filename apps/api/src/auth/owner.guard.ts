import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

type RequestWithOwner = Request & {
  owner?: unknown;
};

@Injectable()
export class OwnerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithOwner>();

    if (!request.owner) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}
