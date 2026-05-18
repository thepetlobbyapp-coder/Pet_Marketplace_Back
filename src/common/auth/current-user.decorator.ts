import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import { type AuthUser, REQUEST_USER_KEY } from './auth-user';

type RequestWithAuthUser = Request &
  Partial<Record<typeof REQUEST_USER_KEY, AuthUser>>;

/** Injects the authenticated user resolved by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<RequestWithAuthUser>();
    const user = req[REQUEST_USER_KEY];

    if (!user) {
      throw new InternalServerErrorException(
        'Authenticated user missing from request context.',
      );
    }

    return user;
  },
);
