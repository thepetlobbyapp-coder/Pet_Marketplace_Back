import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Roles } from '../common/auth/roles.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { DomainException } from '../common/errors/domain.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { parseCursorPaginationQuery } from '../common/pagination/cursor-pagination';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import {
  AdminAuditLogListResponseDto,
  AdminBookingListResponseDto,
  AdminDashboardResponseDto,
  AdminProviderListResponseDto,
  AdminReviewListResponseDto,
  AdminUserResponseDto,
  AdminUserListResponseDto,
} from './dto/admin-response.dto';
import {
  parseAdminUserId,
  parseUpdateAdminUserStatusBody,
  type UpdateAdminUserStatusRequestDto,
} from './dto/update-admin-user-status-request.dto';
import {
  parseAdminReviewId,
  parseUpdateAdminReviewStatusBody,
  type UpdateAdminReviewStatusRequestDto,
} from './dto/update-admin-review-status-request.dto';
import { ReviewResponseDto } from '../bookings/dto/booking-response.dto';

const ADMIN_LIST_DEFAULT_LIMIT = 50;
const ADMIN_LIST_MAX_LIMIT = 100;

@ApiTags('admin')
@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get('dashboard')
  @ApiOkResponse({ type: AdminDashboardResponseDto })
  async getDashboard(): Promise<AdminDashboardResponseDto> {
    const summary = await this.admin.getAdminDashboardSummary();
    return AdminDashboardResponseDto.fromRecord(summary);
  }

  @Get('users')
  @ApiOkResponse({ type: AdminUserListResponseDto })
  async listUsers(@Query() query: unknown): Promise<AdminUserListResponseDto> {
    const pagination = parseAdminListPagination(query);
    const page = await this.admin.listAdminUsers(pagination);
    return AdminUserListResponseDto.fromRecords(page.items, page.nextCursor);
  }

  @Patch('users/:id/status')
  @ApiOkResponse({ type: AdminUserResponseDto })
  async updateUserStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserStatusRequestDto,
  ): Promise<AdminUserResponseDto> {
    const userId = parseAdminUserId(id);
    const input = parseUpdateAdminUserStatusBody(body);
    const updated = await this.admin.updateAdminUserStatusWithAudit(
      user.id,
      userId,
      input,
    );
    if (!updated) {
      throw adminUserNotFound();
    }
    return AdminUserResponseDto.fromRecord(updated);
  }

  @Patch('reviews/:id/status')
  @ApiOkResponse({ type: ReviewResponseDto })
  async updateReviewStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateAdminReviewStatusRequestDto,
  ): Promise<ReviewResponseDto> {
    const reviewId = parseAdminReviewId(id);
    const input = parseUpdateAdminReviewStatusBody(body);
    const updated = await this.admin.setAdminReviewStatusWithAudit(
      user.id,
      reviewId,
      input.status,
    );
    if (!updated) {
      throw adminReviewNotFound();
    }
    return ReviewResponseDto.fromRecord(updated);
  }

  @Get('providers')
  @ApiOkResponse({ type: AdminProviderListResponseDto })
  async listProviders(
    @Query() query: unknown,
  ): Promise<AdminProviderListResponseDto> {
    const pagination = parseAdminListPagination(query);
    const page = await this.admin.listAdminProviders(pagination);
    return AdminProviderListResponseDto.fromRecords(
      page.items,
      page.nextCursor,
    );
  }

  @Get('bookings')
  @ApiOkResponse({ type: AdminBookingListResponseDto })
  async listBookings(
    @Query() query: unknown,
  ): Promise<AdminBookingListResponseDto> {
    const pagination = parseAdminListPagination(query);
    const page = await this.admin.listAdminBookings(pagination);
    return AdminBookingListResponseDto.fromRecords(page.items, page.nextCursor);
  }

  @Get('reviews')
  @ApiOkResponse({ type: AdminReviewListResponseDto })
  async listReviews(
    @Query() query: unknown,
  ): Promise<AdminReviewListResponseDto> {
    const pagination = parseAdminListPagination(query);
    const page = await this.admin.listAdminReviews(pagination);
    return AdminReviewListResponseDto.fromRecords(page.items, page.nextCursor);
  }

  @Get('audit-logs')
  @ApiOkResponse({ type: AdminAuditLogListResponseDto })
  async listAuditLogs(
    @Query() query: unknown,
  ): Promise<AdminAuditLogListResponseDto> {
    const pagination = parseAdminListPagination(query);
    const page = await this.admin.listAdminAuditLogs(pagination);
    return AdminAuditLogListResponseDto.fromRecords(
      page.items,
      page.nextCursor,
    );
  }
}

function parseAdminListPagination(query: unknown) {
  return parseCursorPaginationQuery(query, {
    defaultLimit: ADMIN_LIST_DEFAULT_LIMIT,
    maxLimit: ADMIN_LIST_MAX_LIMIT,
  });
}

function adminUserNotFound() {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Admin user not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}

function adminReviewNotFound() {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Review not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}
