import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { DomainException } from '../common/errors/domain.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { BookingResponseDto } from './dto/booking-response.dto';
import { parseCreateBookingBody } from './dto/create-booking-request.dto';
import { parseUpdateBookingBody } from './dto/update-booking-request.dto';
import { bookingNotFound, parseUuidField } from './dto/booking-fields';

/**
 * Bloco 4G: Bookings API do tutor autenticado.
 * Fase 1 — apenas o ciclo de vida da reserva; nenhum pagamento é processado
 * e nenhuma proteção financeira é prometida (design.md §11 "Payments").
 */
@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get()
  @ApiOkResponse({ type: BookingResponseDto, isArray: true })
  async list(@CurrentUser() user: AuthUser): Promise<BookingResponseDto[]> {
    const tutorProfileId = user.profiles?.tutor?.id;
    if (!tutorProfileId) return [];
    const bookings = await this.admin.listBookings(tutorProfileId);
    return bookings.map((booking) => BookingResponseDto.fromRecord(booking));
  }

  @Post()
  @ApiOkResponse({ type: BookingResponseDto })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<BookingResponseDto> {
    const tutorProfileId = requireTutorProfile(user);
    const input = parseCreateBookingBody(body);
    const booking = await this.admin.createBooking(tutorProfileId, input);
    return BookingResponseDto.fromRecord(booking);
  }

  @Patch(':id')
  @ApiOkResponse({ type: BookingResponseDto })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<BookingResponseDto> {
    const bookingId = parseUuidField(id, 'booking id');
    const input = parseUpdateBookingBody(body);
    const booking = await this.admin.updateBookingStatus(
      user,
      bookingId,
      input.status,
    );
    if (!booking) throw bookingNotFound();
    return BookingResponseDto.fromRecord(booking);
  }
}

/**
 * Reservas exigem um `tutor_profile`. O backend ainda não cria esse perfil
 * automaticamente (lacuna registrada em PROGRESS, fora do escopo do Bloco 4G).
 */
function requireTutorProfile(user: AuthUser): string {
  const tutorProfileId = user.profiles?.tutor?.id;
  if (!tutorProfileId) {
    throw new DomainException(
      ErrorCode.NOT_FOUND,
      'Authenticated user has no tutor profile.',
      {},
      HttpStatus.NOT_FOUND,
    );
  }
  return tutorProfileId;
}
