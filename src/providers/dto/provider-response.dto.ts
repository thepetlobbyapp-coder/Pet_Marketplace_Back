import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PROVIDER_CATEGORIES,
  type ProviderCategory,
  type ProviderRecord,
} from './provider-fields';

/**
 * Contrato seguro de um prestador no marketplace (Bloco 4F).
 * Nunca expõe telefone, endereço completo, coordenadas, `provider_profile_id`
 * nem `base_address_id`. `distanceMeters` é APROXIMADO (dezenas de metros).
 */
export class ProviderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Rótulo legível do serviço oferecido.' })
  service!: string;

  @ApiProperty({ enum: PROVIDER_CATEGORIES })
  categoryId!: ProviderCategory;

  @ApiPropertyOptional({ nullable: true, format: 'uri' })
  avatarUrl!: string | null;

  @ApiProperty({ minimum: 0, maximum: 5, description: 'Média de avaliações.' })
  rating!: number;

  @ApiProperty({ minimum: 0, description: 'Quantidade de avaliações.' })
  reviewCount!: number;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Distância APROXIMADA em metros, arredondada para dezenas. ' +
      'Null quando não há localização. Nunca são coordenadas exatas.',
  })
  distanceMeters!: number | null;

  @ApiProperty()
  isAvailable!: boolean;

  @ApiProperty({ minimum: 0, description: 'Preço por hora.' })
  pricePerHour!: number;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  static fromRecord(record: ProviderRecord): ProviderResponseDto {
    return {
      id: record.id,
      name: record.name,
      service: record.service_label,
      categoryId: record.category,
      avatarUrl: record.avatar_url,
      rating: clampRating(record.rating),
      reviewCount: Math.max(0, Math.trunc(toNumber(record.review_count))),
      distanceMeters:
        record.distance_meters === null
          ? null
          : Math.max(0, Math.round(toNumber(record.distance_meters))),
      isAvailable: record.is_available === true,
      pricePerHour: Math.max(0, toNumber(record.price_per_hour)),
      bio: record.bio,
    };
  }
}

/** Mantém o rating dentro do intervalo 0-5 esperado pelo contrato. */
function clampRating(value: number | null): number {
  const rating = toNumber(value);
  if (rating < 0) return 0;
  if (rating > 5) return 5;
  return rating;
}

/** `numeric` do Postgres pode chegar como string via supabase-js. */
function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
}
