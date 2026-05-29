/// <reference types="multer" />
// The triple-slash above pulls the global `Express.Multer.File` namespace at
// compile time WITHOUT generating a runtime `require('multer')` — `multer`
// is not a direct dependency; it ships transitively inside
// `@nestjs/platform-express` and may not be resolvable on its own.
import { Injectable } from '@nestjs/common';
// magic-bytes.js is pure CJS, unlike file-type (ESM-only since v17) which
// breaks under NestJS's CommonJS runtime with ERR_PACKAGE_PATH_NOT_EXPORTED.
import { filetypeinfo } from 'magic-bytes.js';
import { PinoLogger } from 'nestjs-pino';
import sharp from 'sharp';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_DIMENSION,
  AVATAR_MAX_SIZE_BYTES,
  AVATAR_MIN_DIMENSION,
  AVATAR_OUTPUT_DIMENSION,
  AVATAR_SIGNED_URL_TTL_SECONDS,
  AvatarMime,
  avatarDimensionsInvalid,
  avatarMissing,
  avatarStorageUnavailable,
  avatarTooLarge,
  invalidAvatarType,
} from './dto/avatar.dto';

const BUCKET = 'avatars';
const STORED_OBJECT_FILENAME = 'avatar.jpg';
const STORED_CONTENT_TYPE = 'image/jpeg';

/**
 * Handles avatar upload pipeline: validate magic-byte MIME, reject oversized
 * files, enforce dimension bounds, strip EXIF, resize to a square thumbnail
 * and upload to the private `avatars` Storage bucket. Read access is always
 * mediated by short-lived signed URLs.
 */
@Injectable()
export class AvatarService {
  constructor(
    private readonly admin: SupabaseAdminService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AvatarService.name);
  }

  /**
   * Persist a new avatar for the given user. Idempotent: the storage key is
   * deterministic per user, so retrying overwrites the previous object.
   *
   * Returns a short-lived signed URL the client can render immediately. The
   * canonical fresh URL must still be fetched via GET /me on subsequent loads.
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<{ avatarUrl: string }> {
    if (!this.admin.isConfigured) throw avatarStorageUnavailable();
    if (!file || !file.buffer || file.size === 0) throw avatarMissing();
    if (file.size > AVATAR_MAX_SIZE_BYTES) throw avatarTooLarge(file.size);

    // magic-bytes returns every plausible match (some signatures alias).
    // We accept the file iff ANY candidate is in our allowlist, and adopt
    // the matching MIME for downstream logging.
    const candidates = filetypeinfo(file.buffer);
    const detectedMime = candidates
      .map((c) => c.mime)
      .find(
        (mime): mime is AvatarMime =>
          typeof mime === 'string' &&
          AVATAR_ALLOWED_MIME.includes(mime as AvatarMime),
      );
    if (!detectedMime) {
      throw invalidAvatarType();
    }

    let processed: Buffer;
    let originalWidth: number | null = null;
    let originalHeight: number | null = null;
    try {
      const pipeline = sharp(file.buffer, { failOn: 'error' });
      const metadata = await pipeline.metadata();
      originalWidth = metadata.width ?? null;
      originalHeight = metadata.height ?? null;
      const w = originalWidth ?? 0;
      const h = originalHeight ?? 0;
      if (
        w < AVATAR_MIN_DIMENSION ||
        h < AVATAR_MIN_DIMENSION ||
        w > AVATAR_MAX_DIMENSION ||
        h > AVATAR_MAX_DIMENSION
      ) {
        throw avatarDimensionsInvalid({ width: w, height: h });
      }

      processed = await sharp(file.buffer, { failOn: 'error' })
        .rotate() // honour EXIF rotation BEFORE stripping it
        .resize(AVATAR_OUTPUT_DIMENSION, AVATAR_OUTPUT_DIMENSION, {
          fit: 'cover',
          position: 'attention',
        })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    } catch (error) {
      if (error instanceof Error && error.name === 'DomainException') throw error;
      // sharp throws for corrupt/invalid images — treat as invalid type.
      throw invalidAvatarType();
    }

    const storagePath = `${userId}/${STORED_OBJECT_FILENAME}`;
    const client = this.admin.storageClient;
    const upload = await client.storage
      .from(BUCKET)
      .upload(storagePath, processed, {
        cacheControl: 'private, max-age=3600',
        contentType: STORED_CONTENT_TYPE,
        upsert: true,
      });

    if (upload.error) {
      this.logger.error(
        {
          event: 'avatar.upload',
          userId,
          outcome: 'storage_failed',
          code: upload.error.name,
        },
        'Failed to upload avatar object.',
      );
      throw avatarStorageUnavailable();
    }

    await this.admin.setAvatarPath(userId, storagePath);

    const signedUrl = await this.createSignedUrl(storagePath);
    this.logger.info(
      {
        event: 'avatar.upload',
        userId,
        outcome: 'ok',
        sizeBytes: processed.length,
        mime: detectedMime,
        originalWidth,
        originalHeight,
      },
      'Avatar uploaded.',
    );
    return { avatarUrl: signedUrl };
  }

  async deleteAvatar(userId: string): Promise<void> {
    if (!this.admin.isConfigured) throw avatarStorageUnavailable();
    const path = await this.admin.getAvatarPath(userId);
    if (!path) return;

    const client = this.admin.storageClient;
    const remove = await client.storage.from(BUCKET).remove([path]);
    if (remove.error) {
      this.logger.error(
        {
          event: 'avatar.delete',
          userId,
          outcome: 'storage_failed',
          code: remove.error.name,
        },
        'Failed to delete avatar object.',
      );
      throw avatarStorageUnavailable();
    }

    await this.admin.setAvatarPath(userId, null);
    this.logger.info(
      { event: 'avatar.delete', userId, outcome: 'ok' },
      'Avatar deleted.',
    );
  }

  /** Resolve a fresh signed URL for the caller — used by GET /me. */
  async resolveSignedUrl(userId: string): Promise<string | null> {
    if (!this.admin.isConfigured) return null;
    const path = await this.admin.getAvatarPath(userId);
    if (!path) return null;
    return this.createSignedUrl(path);
  }

  private async createSignedUrl(storagePath: string): Promise<string> {
    const client = this.admin.storageClient;
    const { data, error } = await client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, AVATAR_SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      this.logger.error(
        { event: 'avatar.sign', outcome: 'sign_failed', code: error?.name },
        'Failed to create avatar signed URL.',
      );
      throw avatarStorageUnavailable();
    }
    return data.signedUrl;
  }
}
