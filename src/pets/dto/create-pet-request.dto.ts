import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  parseOptionalText,
  parseRequiredName,
  parseSize,
  parseSpecies,
  petValidationError,
  PET_SIZES,
  PET_SPECIES,
  type PetSize,
  type PetSpecies,
} from './pet-fields';

/** Entrada validada para criar um pet do tutor autenticado. */
export interface CreatePetInput {
  name: string;
  species: PetSpecies;
  breed: string | null;
  size: PetSize;
  ageRange: string | null;
  notes: string | null;
}

export class CreatePetRequestDto {
  @ApiProperty({ maxLength: 120, example: 'Rex' })
  name!: string;

  @ApiProperty({ enum: PET_SPECIES })
  species!: PetSpecies;

  @ApiPropertyOptional({ enum: PET_SIZES, default: 'unknown' })
  size?: PetSize;

  @ApiPropertyOptional({ nullable: true, maxLength: 120 })
  breed?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 60, example: 'adult' })
  ageRange?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2000 })
  notes?: string | null;
}

export function parseCreatePetBody(value: unknown): CreatePetInput {
  const body = asAllowlistedBody(value);

  if (!('name' in body)) {
    throw petValidationError('name is required.');
  }
  if (!('species' in body)) {
    throw petValidationError('species is required.');
  }

  return {
    name: parseRequiredName(body.name),
    species: parseSpecies(body.species),
    size: 'size' in body ? parseSize(body.size) : 'unknown',
    breed: 'breed' in body ? parseOptionalText(body.breed, 'breed') : null,
    ageRange:
      'ageRange' in body ? parseOptionalText(body.ageRange, 'ageRange') : null,
    notes: 'notes' in body ? parseOptionalText(body.notes, 'notes') : null,
  };
}
