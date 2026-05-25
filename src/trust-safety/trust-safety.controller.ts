import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuditLogger } from '../audit/audit.logger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Roles } from '../common/auth/roles.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import {
  parseCreateReportBody,
  type CreateReportRequestDto,
} from './dto/create-report-request.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import {
  parseTrustSafetyUuid,
  trustSafetyNotFound,
} from './dto/trust-safety-fields';
import {
  parseUpdateReportBody,
  type UpdateReportRequestDto,
} from './dto/update-report-request.dto';
import { UserBlockResponseDto } from './dto/user-block-response.dto';

@ApiTags('trust-safety')
@Controller()
export class TrustSafetyController {
  constructor(
    private readonly admin: SupabaseAdminService,
    private readonly audit: AuditLogger,
  ) {}

  @Post('reports')
  @ApiOkResponse({ type: ReportResponseDto })
  async createReport(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateReportRequestDto,
  ): Promise<ReportResponseDto> {
    const input = parseCreateReportBody(body);
    const report = await this.admin.createTrustSafetyReport(user, input);
    if (!report) throw trustSafetyNotFound();

    this.audit.record({
      actorUserId: user.id,
      action: 'trust_safety.report_created',
      entityType: 'report',
      entityId: report.id,
      metadata: {
        category: report.category,
        status: report.status,
        targetType: report.target_type,
      },
    });

    return ReportResponseDto.fromRecord(report);
  }

  @Post('conversations/:id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserBlockResponseDto })
  async blockConversationParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<UserBlockResponseDto> {
    const conversationId = parseTrustSafetyUuid(id, 'conversation id');
    const block = await this.admin.blockConversationParticipant(
      user,
      conversationId,
    );
    if (!block) throw trustSafetyNotFound();

    this.audit.record({
      actorUserId: user.id,
      action: 'trust_safety.user_blocked',
      entityType: 'user_block',
      entityId: block.id,
      metadata: { conversationId: block.conversation_id },
    });

    return UserBlockResponseDto.fromRecord(block);
  }

  @Get('admin/reports')
  @Roles('admin')
  @ApiOkResponse({ type: ReportResponseDto, isArray: true })
  async listAdminReports(): Promise<ReportResponseDto[]> {
    const reports = await this.admin.listAdminReports();
    return reports.map((report) => ReportResponseDto.fromRecord(report));
  }

  @Patch('admin/reports/:id')
  @Roles('admin')
  @ApiOkResponse({ type: ReportResponseDto })
  async updateAdminReport(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateReportRequestDto,
  ): Promise<ReportResponseDto> {
    const reportId = parseTrustSafetyUuid(id, 'report id');
    const input = parseUpdateReportBody(body);
    const report = await this.admin.updateAdminReportStatus(
      user.id,
      reportId,
      input,
    );
    if (!report) throw trustSafetyNotFound();

    this.audit.record({
      actorUserId: user.id,
      action: 'trust_safety.report_status_updated',
      entityType: 'report',
      entityId: report.id,
      metadata: { status: report.status },
    });

    return ReportResponseDto.fromRecord(report);
  }
}
