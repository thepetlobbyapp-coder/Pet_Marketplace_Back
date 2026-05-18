import { SetMetadata } from '@nestjs/common';
import type { Role } from './auth-user';

export const ROLES_KEY = 'roles';

/** Exige um dos papéis informados (avaliado pelo RolesGuard). */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
