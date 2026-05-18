import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { REQUEST_USER_KEY, type AuthUser } from './auth-user';
import { SupabaseService } from './supabase.service';
import { AuthBackendUnavailableException } from '../errors/domain.exception';

/**
 * Valida o token Supabase e anexa o AuthUser ao request.
 * Rotas @Public() são liberadas. Sem backend configurado => 503 (D-009).
 * O backend é a autoridade: nunca confia em claims do client sem verificação.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    if (!this.supabase.isConfigured) {
      throw new AuthBackendUnavailableException();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const user = await this.supabase.resolveUser(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    (req as Request & Record<string, AuthUser>)[REQUEST_USER_KEY] = user;
    return true;
  }

  private extractToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }
}
