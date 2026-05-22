import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  parseOptionalText,
  parseRequiredName,
  parseSize,
  parseSpecies,
  petValidationError,
  PET_ALLOWED_FIELDS,
  PET_SIZES,
  PET_SPECIES,
  type PetSize,
  type PetSpecies,
} from './pet-fields';

/** Entrada validada para atualizar parcialmente um pet do tutor. */
export interface UpdatePetInput {
  name?: string;
  species?: PetSpecies;
  size?: PetSize;
  breed?: string | null;
  ageRange?: string | null;
  notes?: string | null;
}

export class UpdatePetRequestDto {
  @ApiPropertyOptional({ maxLength: 120 })
  name?: string;

  @ApiPropertyOptional({ enum: PET_SPECIES })
  species?: PetSpecies;

  @ApiPropertyOptional({ enum: PET_SIZES })
  size?: PetSize;

  @ApiPropertyOptional({ nullable: true, maxLength: 120 })
  breed?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 60 })
  ageRange?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2000 })
  notes?: string | null;
}

export function parseUpdatePetBody(value: unknown): UpdatePetInput {
  const body = asAllowlistedBody(value);
  const input: UpdatePetInput = {};

  if ('name' in body) input.name = parseRequiredName(body.name);
  if ('species' in body) input.species = parseSpecies(body.species);
  if ('size' in body) input.size = parseSize(body.size);
  if ('breed' in body) input.breed = parseOptionalText(body.breed, 'breed');
  if ('ageRange' in body) {
    input.ageRange = parseOptionalText(body.ageRange, 'ageRange');
  }
  if ('notes' in body) input.notes = parseOptionalText(body.notes, 'notes');

  if (Object.keys(input).length === 0) {
    throw petValidationError('Request must update at least one pet field.', {
      allowedFields: [...PET_ALLOWED_FIELDS],
    });
  }

  return input;
}
