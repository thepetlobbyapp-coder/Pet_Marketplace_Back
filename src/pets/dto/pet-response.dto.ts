import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PET_SIZES,
  PET_SPECIES,
  type PetRecord,
  type PetSize,
  type PetSpecies,
} from './pet-fields';

/**
 * Contrato seguro de um pet. Nunca expõe `tutor_profile_id`, `deleted_at`,
 * service role, tokens ou metadata (Bloco 4B).
 */
export class PetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PET_SPECIES })
  species!: PetSpecies;

  @ApiPropertyOptional({ nullable: true })
  breed!: string | null;

  @ApiProperty({ enum: PET_SIZES })
  size!: PetSize;

  @ApiPropertyOptional({ nullable: true })
  ageRange!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(row: PetRecord): PetResponseDto {
    return {
      id: row.id,
      name: row.name,
      species: row.species,
      breed: row.breed,
      size: row.size,
      ageRange: row.age_range,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
