import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { DomainException } from '../common/errors/domain.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { ProviderResponseDto } from './dto/provider-response.dto';
import {
  ListProvidersQueryDto,
  parseListProvidersQuery,
} from './dto/list-providers-query.dto';
import { providerNotFound } from './dto/provider-fields';
import {
  ProviderWeeklyAvailabilityDto,
  TimeSlotResponseDto,
  buildTimeSlots,
  parseAvailabilityQuery,
  parseProviderWeeklyAvailabilityBody,
} from '../bookings/dto/availability.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bloco 4F: Providers API do marketplace.
 * Lista prestadores próximos do condomínio (endereço padrão) do tutor logado.
 * Toda resposta passa pela projeção segura das RPCs `providers_*`: distância
 * apenas APROXIMADA, sem telefone, endereço completo ou coordenadas.
 */
@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get('me/availability')
  @ApiOkResponse({ type: ProviderWeeklyAvailabilityDto })
  async ownAvailability(
    @CurrentUser() user: AuthUser,
  ): Promise<ProviderWeeklyAvailabilityDto> {
    const availability =
      await this.admin.getOwnProviderWeeklyAvailability(user);
    return ProviderWeeklyAvailabilityDto.fromDays(availability);
  }

  @Patch('me/availability')
  @ApiOkResponse({ type: ProviderWeeklyAvailabilityDto })
  async updateOwnAvailability(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<ProviderWeeklyAvailabilityDto> {
    const input = parseProviderWeeklyAvailabilityBody(body);
    const availability = await this.admin.updateOwnProviderWeeklyAvailability(
      user,
      input,
    );
    return ProviderWeeklyAvailabilityDto.fromDays(availability);
  }

  @Get()
  @ApiQuery({ type: ListProvidersQueryDto })
  @ApiOkResponse({ type: ProviderResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: unknown,
  ): Promise<ProviderResponseDto[]> {
    const filter = parseListProvidersQuery(query);
    const providers = await this.admin.listProviders(user.id, filter);
    return providers.map((provider) =>
      ProviderResponseDto.fromRecord(provider),
    );
  }

  @Get(':id/availability')
  @ApiOkResponse({ type: TimeSlotResponseDto, isArray: true })
  async availability(
    @Param('id') id: string,
    @Query() query: unknown,
  ): Promise<TimeSlotResponseDto[]> {
    const providerId = parseProviderId(id);
    const { date } = parseAvailabilityQuery(query);
    const occupiedSlotIds = await this.admin.getProviderAvailability(
      providerId,
      date,
    );
    if (occupiedSlotIds === null) throw providerNotFound();
    return buildTimeSlots(occupiedSlotIds);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProviderResponseDto })
  async detail(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ProviderResponseDto> {
    const providerId = parseProviderId(id);
    const provider = await this.admin.getProvider(user.id, providerId);
    if (!provider) throw providerNotFound();
    return ProviderResponseDto.fromRecord(provider);
  }
}

function parseProviderId(id: string): string {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      'Provider id must be a valid UUID.',
      {},
      HttpStatus.BAD_REQUEST,
    );
  }
  return id;
}
