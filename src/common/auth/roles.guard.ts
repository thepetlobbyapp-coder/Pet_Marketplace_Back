import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { REQUEST_USER_KEY, type AuthUser, type Role } from './auth-user';

/**
 * Autorização por papel (D-006). Usuário 'blocked' não passa em rota privada.
 * Roda após o AuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as Request & Record<string, AuthUser>)[
      REQUEST_USER_KEY
    ];

    if (!user) {
      throw new ForbiddenException('No authenticated user in context.');
    }
    if (user.status !== 'active') {
      throw new ForbiddenException('Account is not active.');
    }

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const allowed = required.some((r) => user.roles.includes(r));
    if (!allowed) {
      throw new ForbiddenException('Insufficient role for this action.');
    }
    return true;
  }
}
