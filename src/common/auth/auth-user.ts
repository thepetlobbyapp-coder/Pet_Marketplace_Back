/** Papéis da Fase 1 (D-006). */
export type Role = 'tutor' | 'provider' | 'admin';

export type UserStatus = 'active' | 'blocked' | 'deleted';

export type ProviderStatus = 'active' | 'paused' | 'blocked' | 'deleted';

export interface TutorProfileSummary {
  id: string;
  displayName: string;
}

export interface ProviderProfileSummary {
  id: string;
  displayName: string;
  status: ProviderStatus;
  serviceRadiusKm: number;
  ratingAverage: number | null;
  ratingCount: number;
}

/** Usuário autenticado resolvido pelo backend a partir do token Supabase. */
export interface AuthUser {
  id: string;
  email?: string;
  roles: Role[];
  status: UserStatus;
  locale?: string;
  createdAt?: string;
  updatedAt?: string;
  profiles?: {
    tutor?: TutorProfileSummary;
    provider?: ProviderProfileSummary;
  };
}

/** Chave usada para anexar o usuário ao request. */
export const REQUEST_USER_KEY = 'authUser' as const;
