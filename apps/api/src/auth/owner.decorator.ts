import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export type RequestOwner = {
  id: string;
};

type RequestWithOwner = Request & {
  owner?: RequestOwner;
};

export const CurrentOwner = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithOwner>();

  if (!request.owner) {
    throw new UnauthorizedException('Authentication required');
  }

  return request.owner;
});
