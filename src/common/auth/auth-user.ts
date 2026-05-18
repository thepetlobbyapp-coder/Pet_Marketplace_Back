/** Papéis da Fase 1 (D-006). */
export type Role = 'tutor' | 'provider' | 'admin';

export type UserStatus = 'active' | 'blocked';

/** Usuário autenticado resolvido pelo backend a partir do token Supabase. */
export interface AuthUser {
  id: string;
  email?: string;
  roles: Role[];
  status: UserStatus;
}

/** Chave usada para anexar o usuário ao request. */
export const REQUEST_USER_KEY = 'authUser' as const;
