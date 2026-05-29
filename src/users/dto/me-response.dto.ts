import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AuthUser,
  ProviderProfileSummary,
  Role,
  UserStatus,
} from '../../common/auth/auth-user';

class TutorProfileSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({
    description:
      'Whether the tutor has a default address set. The address itself (and ' +
      'its identifier) is never exposed; only presence, which the app uses to ' +
      'gate marketplace discovery.',
  })
  hasDefaultAddress!: boolean;
}

class ProviderProfileSummaryDto implements ProviderProfileSummary {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiProperty({ enum: ['active', 'paused', 'blocked', 'deleted'] })
  status!: ProviderProfileSummary['status'];

  @ApiProperty()
  serviceRadiusKm!: number;

  @ApiPropertyOptional({ nullable: true })
  ratingAverage!: number | null;

  @ApiProperty()
  ratingCount!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  listingId!: string | null;

  @ApiPropertyOptional({
    enum: ['walk', 'sitting', 'transport', 'boarding'],
    nullable: true,
  })
  categoryId!: ProviderProfileSummary['categoryId'];

  @ApiPropertyOptional({ nullable: true })
  service!: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0 })
  pricePerHour!: number | null;

  @ApiPropertyOptional({ nullable: true })
  isAvailable!: boolean | null;
}

class LinkedProfilesDto {
  @ApiPropertyOptional({ type: TutorProfileSummaryDto })
  tutor?: TutorProfileSummaryDto;

  @ApiPropertyOptional({ type: ProviderProfileSummaryDto })
  provider?: ProviderProfileSummaryDto;
}

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'email' })
  email?: string;

  @ApiProperty({ enum: ['tutor', 'provider', 'admin'], isArray: true })
  roles!: Role[];

  @ApiProperty({ enum: ['active', 'blocked', 'deleted'] })
  status!: UserStatus;

  @ApiPropertyOptional({ example: 'en-GB' })
  locale?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  createdAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  updatedAt?: string;

  @ApiPropertyOptional({
    description:
      'Short-lived (1h) signed URL pointing at the user avatar. Null when ' +
      'no avatar is set. Clients must NOT cache it past the TTL; refetch GET /me.',
    format: 'uri',
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ type: LinkedProfilesDto })
  profiles?: LinkedProfilesDto;

  /**
   * Build the response from an AuthUser, optionally resolving a fresh signed
   * URL when the user has an avatar object. The signed URL is generated on
   * demand by the caller (controller) to keep this DTO free of side effects;
   * callers that don't care about the avatar URL can omit `avatarUrl`.
   */
  static fromAuthUser(
    user: AuthUser,
    options: { avatarUrl?: string | null } = {},
  ): MeResponseDto {
    return {
      id: user.id,
      ...(user.email ? { email: user.email } : {}),
      roles: user.roles,
      status: user.status,
      ...(user.locale ? { locale: user.locale } : {}),
      ...(user.createdAt ? { createdAt: user.createdAt } : {}),
      ...(user.updatedAt ? { updatedAt: user.updatedAt } : {}),
      ...(options.avatarUrl !== undefined
        ? { avatarUrl: options.avatarUrl }
        : {}),
      ...(user.profiles && hasProfiles(user.profiles)
        ? {
            profiles: {
              ...(user.profiles.tutor
                ? {
                    tutor: {
                      id: user.profiles.tutor.id,
                      displayName: user.profiles.tutor.displayName,
                      hasDefaultAddress: Boolean(
                        user.profiles.tutor.defaultAddressId,
                      ),
                    },
                  }
                : {}),
              ...(user.profiles.provider
                ? {
                    provider: {
                      id: user.profiles.provider.id,
                      displayName: user.profiles.provider.displayName,
                      bio: user.profiles.provider.bio,
                      status: user.profiles.provider.status,
                      serviceRadiusKm: user.profiles.provider.serviceRadiusKm,
                      ratingAverage: user.profiles.provider.ratingAverage,
                      ratingCount: user.profiles.provider.ratingCount,
                      listingId: user.profiles.provider.listingId,
                      categoryId: user.profiles.provider.categoryId,
                      service: user.profiles.provider.service,
                      pricePerHour: user.profiles.provider.pricePerHour,
                      isAvailable: user.profiles.provider.isAvailable,
                    },
                  }
                : {}),
            },
          }
        : {}),
    };
  }
}

function hasProfiles(profiles: AuthUser['profiles']): boolean {
  return Boolean(profiles?.tutor || profiles?.provider);
}
