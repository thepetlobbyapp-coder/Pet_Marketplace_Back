import { ApiProperty } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  bookingValidationError,
  parseRatingField,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
} from './booking-fields';

/** Entrada validada para avaliar o prestador de uma reserva concluída. */
export interface SubmitReviewInput {
  rating: number;
}

const SUBMIT_REVIEW_ALLOWED_FIELDS = ['rating'] as const;

export class SubmitReviewRequestDto {
  @ApiProperty({
    minimum: REVIEW_RATING_MIN,
    maximum: REVIEW_RATING_MAX,
    example: 5,
  })
  rating!: number;
}

export function parseSubmitReviewBody(value: unknown): SubmitReviewInput {
  const body = asAllowlistedBody(value, SUBMIT_REVIEW_ALLOWED_FIELDS);

  if (!('rating' in body)) {
    throw bookingValidationError('rating is required.');
  }

  return { rating: parseRatingField(body.rating) };
}
