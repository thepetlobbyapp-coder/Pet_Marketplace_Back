import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/** Hard byte limit accepted by the API (mirrors the Storage bucket cap). */
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
/** Allowed MIME types — both client-declared and magic-byte-verified. */
export const AVATAR_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type AvatarMime = (typeof AVATAR_ALLOWED_MIME)[number];

/** Minimum/maximum dimensions accepted at validation. */
export const AVATAR_MIN_DIMENSION = 256;
export const AVATAR_MAX_DIMENSION = 4096;

/** Final stored size after the server resize. */
export const AVATAR_OUTPUT_DIMENSION = 256;
/** Signed URL TTL returned to the client (1h, refreshed by GET /me). */
export const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60;

export class AvatarResponseDto {
  @ApiProperty({
    description:
      'Short-lived signed URL pointing at the stored avatar object. ' +
      'TTL is 1h; clients should refetch GET /me before expiry.',
    format: 'uri',
  })
  avatarUrl!: string;
}

export function invalidAvatarType(): DomainException {
  return new DomainException(
    ErrorCode.VALIDATION_ERROR,
    'Invalid file type. Avatar must be a JPEG, PNG or WEBP image.',
    { allowedMime: [...AVATAR_ALLOWED_MIME] },
    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
  );
}

export function avatarTooLarge(actualBytes: number): DomainException {
  return new DomainException(
    ErrorCode.VALIDATION_ERROR,
    'Avatar exceeds the maximum allowed size.',
    { maxBytes: AVATAR_MAX_SIZE_BYTES, actualBytes },
    HttpStatus.PAYLOAD_TOO_LARGE,
  );
}

export function avatarDimensionsInvalid(details: {
  width: number | null;
  height: number | null;
}): DomainException {
  return new DomainException(
    ErrorCode.VALIDATION_ERROR,
    'Avatar dimensions are outside the accepted range.',
    {
      minDimension: AVATAR_MIN_DIMENSION,
      maxDimension: AVATAR_MAX_DIMENSION,
      width: details.width,
      height: details.height,
    },
    HttpStatus.BAD_REQUEST,
  );
}

export function avatarMissing(): DomainException {
  return new DomainException(
    ErrorCode.VALIDATION_ERROR,
    'Avatar file is required in the `image` form field.',
    {},
    HttpStatus.BAD_REQUEST,
  );
}

export function avatarStorageUnavailable(): DomainException {
  return new DomainException(
    ErrorCode.AUTH_BACKEND_UNAVAILABLE,
    'Avatar storage is temporarily unavailable. Please try again.',
    {},
    HttpStatus.SERVICE_UNAVAILABLE,
  );
}
