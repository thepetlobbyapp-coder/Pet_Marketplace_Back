/** Papéis da Fase 1 (D-006). */
export type Role = 'tutor' | 'provider' | 'admin';

export type UserStatus = 'active' | 'blocked' | 'deleted';

export type ProviderStatus = 'active' | 'paused' | 'blocked' | 'deleted';

export interface TutorProfileSummary {
  id: string;
  displayName: string;
  defaultAddressId?: string | null;
}

export interface ProviderProfileSummary {
  bio: string | null;
  categoryId: 'boarding' | 'sitting' | 'transport' | 'walk' | null;
  id: string;
  isAvailable: boolean | null;
  listingId: string | null;
  displayName: string;
  pricePerHour: number | null;
  status: ProviderStatus;
  service: string | null;
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
  /**
   * Storage path of the avatar object (e.g. `{user_id}/avatar.jpg`) when set.
   * Never expose this directly; turn it into a short-lived signed URL in the
   * response layer (`MeResponseDto`).
   */
  avatarPath?: string | null;
  profiles?: {
    tutor?: TutorProfileSummary;
    provider?: ProviderProfileSummary;
  };
}

/** Chave usada para anexar o usuário ao request. */
export const REQUEST_USER_KEY = 'authUser' as const;
