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
import { parseCreatePetBody } from './dto/create-pet-request.dto';
import { parseUpdatePetBody } from './dto/update-pet-request.dto';
import { PetResponseDto } from './dto/pet-response.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bloco 4B: Pets API do tutor autenticado.
 * Cada operação é escopada ao `tutor_profile` do usuário — um tutor só
 * lê/altera os próprios pets. DELETE é soft delete (`deleted_at`).
 */
@ApiTags('pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get()
  @ApiOkResponse({ type: PetResponseDto, isArray: true })
  async list(@CurrentUser() user: AuthUser): Promise<PetResponseDto[]> {
    const tutorProfileId = user.profiles?.tutor?.id;
    if (!tutorProfileId) return [];
    const pets = await this.admin.listPets(tutorProfileId);
    return pets.map((pet) => PetResponseDto.fromRecord(pet));
  }

  @Post()
  @ApiOkResponse({ type: PetResponseDto })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<PetResponseDto> {
    const tutorProfileId = requireTutorProfile(user);
    const input = parseCreatePetBody(body);
    const pet = await this.admin.createPet(tutorProfileId, input);
    return PetResponseDto.fromRecord(pet);
  }

  @Patch(':id')
  @ApiOkResponse({ type: PetResponseDto })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<PetResponseDto> {
    const tutorProfileId = requireTutorProfile(user);
    const petId = parsePetId(id);
    const input = parseUpdatePetBody(body);
    const pet = await this.admin.updatePet(tutorProfileId, petId, input);
    if (!pet) throw petNotFound();
    return PetResponseDto.fromRecord(pet);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Pet soft-deleted.' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    const tutorProfileId = requireTutorProfile(user);
    const petId = parsePetId(id);
    const deleted = await this.admin.softDeletePet(tutorProfileId, petId);
    if (!deleted) throw petNotFound();
  }
}

/**
 * Pets exigem um `tutor_profile` existente. O backend ainda não cria esse
 * perfil (fora do escopo do Bloco 4B) — ver lacuna registrada em PROGRESS.
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

function parsePetId(id: string): string {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new DomainException(
      ErrorCode.VALIDATION_ERROR,
      'Pet id must be a valid UUID.',
      {},
      HttpStatus.BAD_REQUEST,
    );
  }
  return id;
}

function petNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Pet not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}
