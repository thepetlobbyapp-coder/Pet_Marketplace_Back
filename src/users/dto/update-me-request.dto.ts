import { HttpStatus } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../../common/errors/error-codes';
import { DomainException } from '../../common/errors/domain.exception';

const ALLOWED_FIELDS = ['locale'] as const;
const LOCALE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;

export interface UpdateMeInput {
  locale: string;
}

export class UpdateMeRequestDto {
  @ApiPropertyOptional({
    description: 'Preferred BCP 47 locale for the authenticated user.',
    example: 'en-GB',
  })
  locale?: string;
}

export function parseUpdateMeBody(value: unknown): UpdateMeInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const unknownFields = Object.keys(body).filter(
    (key) => !ALLOWED_FIELDS.includes(key as (typeof ALLOWED_FIELDS)[number]),
  );

  if (unknownFields.length > 0) {
    throw validationError('Only locale can be updated in this block.', {
      allowedFields: [...ALLOWED_FIELDS],
    });
  }

  const locale = body.locale;
  if (typeof locale !== 'string') {
    throw validationError('locale is required.');
  }

  const trimmedLocale = locale.trim();
  if (!LOCALE_PATTERN.test(trimmedLocale) || trimmedLocale.length > 16) {
    throw validationError('locale must be a valid short BCP 47 locale.');
  }

  return { locale: trimmedLocale };
}

function validationError(
  message: string,
  details: Record<string, unknown> = {},
): DomainException {
  return new DomainException(
    ErrorCode.VALIDATION_ERROR,
    message,
    details,
    HttpStatus.BAD_REQUEST,
  );
}
