import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { DomainException } from '../common/errors/domain.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { AuditLogger } from '../audit/audit.logger';
import { AccountDeletionRequestResponseDto } from './dto/account-deletion-request-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import {
  parseCreateTutorProfileBody,
  parseUpdateTutorProfileBody,
  TutorProfileRequestDto,
  TutorProfileResponseDto,
} from './dto/tutor-profile.dto';
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
  ) {}

  @Get()
  @ApiOkResponse({
    description:
      'Authenticated user, database-backed roles, and safe profile summaries.',
    type: MeResponseDto,
  })
  me(@CurrentUser() user: AuthUser): MeResponseDto {
    return MeResponseDto.fromAuthUser(user);
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
    return MeResponseDto.fromAuthUser(updatedUser);
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
    description: 'Created tutor profile for the authenticated user.',
    type: TutorProfileResponseDto,
  })
  async createTutorProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: TutorProfileRequestDto,
  ): Promise<TutorProfileResponseDto> {
    if (user.profiles?.tutor) throw tutorProfileAlreadyExists();

    const input = parseCreateTutorProfileBody(body);
    const profile = await this.admin.createOwnTutorProfile(user.id, input);
    if (!profile) throw tutorProfileAlreadyExists();

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
    if (!user.profiles?.tutor) throw tutorProfileNotFound();

    const input = parseUpdateTutorProfileBody(body);
    const profile = await this.admin.updateOwnTutorProfile(user.id, input);
    if (!profile) throw tutorProfileNotFound();

    return TutorProfileResponseDto.fromRecord(profile);
  }
}

function tutorProfileAlreadyExists(): DomainException {
  return new DomainException(
    ErrorCode.CONFLICT,
    'Authenticated user already has a tutor profile.',
    {},
    HttpStatus.CONFLICT,
  );
}

function tutorProfileNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Authenticated user has no tutor profile.',
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
