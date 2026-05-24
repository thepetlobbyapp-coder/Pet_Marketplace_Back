import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditLogger } from '../audit/audit.logger';
import { Public } from '../common/auth/public.decorator';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import {
  parsePublicAccountDeletionRequestBody,
  type PublicAccountDeletionRequestInput,
  PublicAccountDeletionRequestDto,
  PublicAccountDeletionRequestResponseDto,
  readPublicDeletionResponseMode,
} from './dto/public-account-deletion-request.dto';
import {
  type AccountDeletionPageState,
  renderAccountDeletionPage,
} from './account-deletion.page';

@ApiTags('account deletion')
@Controller('account-deletion')
export class AccountDeletionController {
  constructor(
    private readonly admin: SupabaseAdminService,
    private readonly audit: AuditLogger,
  ) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Public account deletion request page.' })
  page(
    @Query('submitted') submitted?: string,
    @Query('invalid') invalid?: string,
    @Query('error') error?: string,
  ): string {
    return renderAccountDeletionPage(
      pageStateFromQuery({ submitted, invalid, error }),
    );
  }

  @Public()
  @Post('request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({
    description:
      'Accepts a public deletion request without confirming whether the account exists.',
    type: PublicAccountDeletionRequestResponseDto,
  })
  async requestDeletion(
    @Body() body: PublicAccountDeletionRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicAccountDeletionRequestResponseDto | undefined> {
    const responseMode = readPublicDeletionResponseMode(body);
    let input: PublicAccountDeletionRequestInput;

    try {
      input = parsePublicAccountDeletionRequestBody(body);
    } catch (error) {
      if (responseMode === 'web') {
        redirectToAccountDeletionPage(res, 'invalid');
        return undefined;
      }
      throw error;
    }

    try {
      const result = await this.admin.requestPublicAccountDeletionByEmail(
        input.email,
      );
      this.audit.record({
        actorUserId: result.userId,
        action: 'account.public_deletion_requested',
        entityType: 'account_deletion_request',
        entityId: result.requestId,
        metadata: { source: 'public_web' },
      });
    } catch (error) {
      if (input.responseMode === 'web') {
        redirectToAccountDeletionPage(res, 'error');
        return undefined;
      }
      throw error;
    }

    if (input.responseMode === 'web') {
      redirectToAccountDeletionPage(res, 'submitted');
      return undefined;
    }

    return PublicAccountDeletionRequestResponseDto.accepted();
  }
}

function pageStateFromQuery(query: {
  submitted?: string;
  invalid?: string;
  error?: string;
}): AccountDeletionPageState {
  if (query.submitted === '1') return 'submitted';
  if (query.invalid === '1') return 'invalid';
  if (query.error === '1') return 'error';
  return 'form';
}

function redirectToAccountDeletionPage(
  res: Response,
  state: Exclude<AccountDeletionPageState, 'form'>,
): void {
  const query =
    state === 'submitted'
      ? 'submitted=1'
      : state === 'invalid'
        ? 'invalid=1'
        : 'error=1';

  res.status(HttpStatus.SEE_OTHER).location(`/account-deletion?${query}`);
}
