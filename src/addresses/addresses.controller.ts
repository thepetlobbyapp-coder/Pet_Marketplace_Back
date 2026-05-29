import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { DomainException } from '../common/errors/domain.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { AddressResponseDto } from './dto/address-response.dto';
import { parseCreateAddressBody } from './dto/create-address-request.dto';
import { parseUpdateAddressBody } from './dto/update-address-request.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bloco 4E: addresses owned by the authenticated user.
 * No geocoding, Search, Booking or provider onboarding is exposed here.
 */
@ApiTags('addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get()
  @ApiOkResponse({ type: AddressResponseDto, isArray: true })
  async list(@CurrentUser() user: AuthUser): Promise<AddressResponseDto[]> {
    const addresses = await this.admin.listOwnAddresses(user.id);
    return addresses.map((address) => AddressResponseDto.fromRecord(address));
  }

  @Post()
  @ApiOkResponse({ type: AddressResponseDto })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<AddressResponseDto> {
    const input = parseCreateAddressBody(body);
    const address = await this.admin.createOwnAddress(
      user.id,
      user.profiles?.tutor?.id ?? null,
      input,
    );
    return AddressResponseDto.fromRecord(address);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AddressResponseDto })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<AddressResponseDto> {
    const addressId = parseAddressId(id);
    const input = parseUpdateAddressBody(body);
    const address = await this.admin.updateOwnAddress(
      user.id,
      user.profiles?.tutor?.id ?? null,
      addressId,
      input,
    );
    if (!address) throw addressNotFound();
    return AddressResponseDto.fromRecord(address);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Address deleted.' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    const addressId = parseAddressId(id);
    const deleted = await this.admin.deleteOwnAddress(user.id, addressId);
    if (!deleted) throw addressNotFound();
  }
}

function parseAddressId(id: string): string {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      'Address id must be a valid UUID.',
      {},
      HttpStatus.BAD_REQUEST,
    );
  }
  return id;
}

function addressNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Address not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}
