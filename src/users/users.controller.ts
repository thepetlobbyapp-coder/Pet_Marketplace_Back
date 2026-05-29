import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
/// <reference types="multer" />
// Pulls `Express.Multer.File` at compile time without emitting a runtime
// `require('multer')` — see avatar.service.ts for the full rationale.
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { DomainException } from '../common/errors/domain.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { AuditLogger } from '../audit/audit.logger';
import { AvatarService } from './avatar.service';
import { AccountDeletionRequestResponseDto } from './dto/account-deletion-request-response.dto';
import {
  AVATAR_MAX_SIZE_BYTES,
  AvatarResponseDto,
} from './dto/avatar.dto';
import { MeResponseDto } from './dto/me-response.dto';
import {
  parseCreateTutorProfileBody,
  parseUpdateTutorProfileBody,
  TutorProfileRequestDto,
  TutorProfileResponseDto,
} from './dto/tutor-profile.dto';
import {
  parseCreateProviderProfileBody,
  parseUpdateProviderProfileBody,
  ProviderProfileRequestDto,
  ProviderProfileResponseDto,
} from './dto/provider-profile.dto';
import {
  parseUpdateMeBody,
  UpdateMeRequestDto,
} from './dto/update-me-request.dto';

/**
 * Authenticated account surface. Destructive account deletion remains out of
 * scope; `/deletion-request` only records the operational request.
 */
@ApiTags('users')
@Controller('me')
export class UsersController {
  constructor(
    private readonly admin: SupabaseAdminService,
    private readonly audit: AuditLogger,
    private readonly avatars: AvatarService,
  ) {}

  @Get()
  @ApiOkResponse({
    description:
      'Authenticated user, database-backed roles, and safe profile summaries.',
    type: MeResponseDto,
  })
  async me(@CurrentUser() user: AuthUser): Promise<MeResponseDto> {
    const avatarUrl = user.avatarPath
      ? await this.avatars.resolveSignedUrl(user.id)
      : null;
    return MeResponseDto.fromAuthUser(user, { avatarUrl });
  }

  @Patch()
  @ApiOkResponse({
    description:
      'Updated authenticated user with backend-owned roles and status.',
    type: MeResponseDto,
  })
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateMeRequestDto,
  ): Promise<MeResponseDto> {
    const input = parseUpdateMeBody(body);
    const updatedUser = await this.admin.updateOwnUser(user.id, input);
    const avatarUrl = updatedUser.avatarPath
      ? await this.avatars.resolveSignedUrl(updatedUser.id)
      : null;
    return MeResponseDto.fromAuthUser(updatedUser, { avatarUrl });
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  // Stricter throttle than the global 60/min: avatar uploads are heavy
  // (sharp + storage I/O) and a stable per-user cap of 5/min prevents
  // abuse and accidental retry storms.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image (JPEG, PNG or WEBP, up to 5 MB).',
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
      required: ['image'],
    },
  })
  @ApiOkResponse({
    description: 'Uploaded avatar, returned as a short-lived signed URL.',
    type: AvatarResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('image', {
      // Hard byte limit at the multipart layer mirrors the API validator
      // so oversize uploads are rejected before reaching sharp.
      limits: { fileSize: AVATAR_MAX_SIZE_BYTES, files: 1 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() image: Express.Multer.File | undefined,
  ): Promise<AvatarResponseDto> {
    const result = await this.avatars.uploadAvatar(user.id, image);
    await this.audit.record({
      actorUserId: user.id,
      action: 'account.avatar_uploaded',
      entityType: 'user',
      entityId: user.id,
      metadata: { sizeBytes: image?.size ?? null, mime: image?.mimetype ?? null },
    });
    return result;
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Avatar deleted (idempotent).' })
  async deleteAvatar(@CurrentUser() user: AuthUser): Promise<void> {
    await this.avatars.deleteAvatar(user.id);
    await this.audit.record({
      actorUserId: user.id,
      action: 'account.avatar_deleted',
      entityType: 'user',
      entityId: user.id,
      metadata: {},
    });
  }

  @Get('deletion-request')
  @ApiOkResponse({
    description: 'Current account deletion request for the authenticated user.',
    type: AccountDeletionRequestResponseDto,
  })
  async getDeletionRequest(
    @CurrentUser() user: AuthUser,
  ): Promise<AccountDeletionRequestResponseDto> {
    const request = await this.admin.getOwnDeletionRequest(user.id);
    if (!request) throw deletionRequestNotFound();
    return AccountDeletionRequestResponseDto.fromRecord(request);
  }

  @Post('deletion-request')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Idempotently records an account deletion request for the authenticated user.',
    type: AccountDeletionRequestResponseDto,
  })
  async requestDeletion(
    @CurrentUser() user: AuthUser,
  ): Promise<AccountDeletionRequestResponseDto> {
    const request = await this.admin.requestOwnAccountDeletion(user.id);
    await this.audit.record({
      actorUserId: user.id,
      action: 'account.deletion_requested',
      entityType: 'account_deletion_request',
      entityId: request.id,
      metadata: { status: request.status },
    });
    return AccountDeletionRequestResponseDto.fromRecord(request);
  }

  @Post('tutor-profile')
  @ApiOkResponse({
    description:
      'Backend-owned tutor role/profile creation for the authenticated user.',
    type: TutorProfileResponseDto,
  })
  async createTutorProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: TutorProfileRequestDto,
  ): Promise<TutorProfileResponseDto> {
    const input = parseCreateTutorProfileBody(body);
    const profile = await this.admin.createOwnTutorProfile(user.id, input);
    if (!profile) throw tutorProfileNotFound();

    return TutorProfileResponseDto.fromRecord(profile);
  }

  @Patch('tutor-profile')
  @ApiOkResponse({
    description: 'Updated tutor profile for the authenticated user.',
    type: TutorProfileResponseDto,
  })
  async updateTutorProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: TutorProfileRequestDto,
  ): Promise<TutorProfileResponseDto> {
    if (!user.roles.includes('tutor') || !user.profiles?.tutor) {
      throw tutorProfileNotFound();
    }

    const input = parseUpdateTutorProfileBody(body);
    const profile = await this.admin.updateOwnTutorProfile(user.id, input);
    if (!profile) throw tutorProfileNotFound();

    return TutorProfileResponseDto.fromRecord(profile);
  }

  @Post('provider-profile')
  @ApiOkResponse({
    description:
      'Backend-owned provider role/profile creation. New profiles start paused and are not marketplace listings.',
    type: ProviderProfileResponseDto,
  })
  async createProviderProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: ProviderProfileRequestDto,
  ): Promise<ProviderProfileResponseDto> {
    const input = parseCreateProviderProfileBody(body);
    const profile = await this.admin.createOwnProviderProfile(user.id, input);
    if (!profile) throw providerProfileNotFound();

    return ProviderProfileResponseDto.fromRecord(profile);
  }

  @Patch('provider-profile')
  @ApiOkResponse({
    description: 'Updated provider profile for the authenticated user.',
    type: ProviderProfileResponseDto,
  })
  async updateProviderProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: ProviderProfileRequestDto,
  ): Promise<ProviderProfileResponseDto> {
    if (!user.roles.includes('provider') || !user.profiles?.provider) {
      throw providerProfileNotFound();
    }

    const input = parseUpdateProviderProfileBody(body);
    const profile = await this.admin.updateOwnProviderProfile(user.id, input);
    if (!profile) throw providerProfileNotFound();

    return ProviderProfileResponseDto.fromRecord(profile);
  }
}

function tutorProfileNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Authenticated user has no tutor profile.',
    {},
    HttpStatus.NOT_FOUND,
  );
}

function providerProfileNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Authenticated user has no provider profile.',
    {},
    HttpStatus.NOT_FOUND,
  );
}

function deletionRequestNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Account deletion request not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}
