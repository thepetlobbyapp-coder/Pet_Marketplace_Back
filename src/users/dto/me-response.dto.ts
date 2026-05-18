import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AuthUser,
  ProviderProfileSummary,
  Role,
  TutorProfileSummary,
  UserStatus,
} from '../../common/auth/auth-user';

class TutorProfileSummaryDto implements TutorProfileSummary {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;
}

class ProviderProfileSummaryDto implements ProviderProfileSummary {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['active', 'paused', 'blocked', 'deleted'] })
  status!: ProviderProfileSummary['status'];

  @ApiProperty()
  serviceRadiusKm!: number;

  @ApiPropertyOptional({ nullable: true })
  ratingAverage!: number | null;

  @ApiProperty()
  ratingCount!: number;
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

  @ApiPropertyOptional({ type: LinkedProfilesDto })
  profiles?: LinkedProfilesDto;

  static fromAuthUser(user: AuthUser): MeResponseDto {
    return {
      id: user.id,
      ...(user.email ? { email: user.email } : {}),
      roles: user.roles,
      status: user.status,
      ...(user.locale ? { locale: user.locale } : {}),
      ...(user.createdAt ? { createdAt: user.createdAt } : {}),
      ...(user.updatedAt ? { updatedAt: user.updatedAt } : {}),
      ...(user.profiles && hasProfiles(user.profiles)
        ? {
            profiles: {
              ...(user.profiles.tutor
                ? {
                    tutor: {
                      id: user.profiles.tutor.id,
                      displayName: user.profiles.tutor.displayName,
                    },
                  }
                : {}),
              ...(user.profiles.provider
                ? {
                    provider: {
                      id: user.profiles.provider.id,
                      displayName: user.profiles.provider.displayName,
                      status: user.profiles.provider.status,
                      serviceRadiusKm: user.profiles.provider.serviceRadiusKm,
                      ratingAverage: user.profiles.provider.ratingAverage,
                      ratingCount: user.profiles.provider.ratingCount,
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
