/// <reference types="multer" />
import { Injectable } from '@nestjs/common';
import { filetypeinfo } from 'magic-bytes.js';
import { PinoLogger } from 'nestjs-pino';
import sharp from 'sharp';
import { DomainException } from '../common/errors/domain.exception';
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

@Injectable()
export class AvatarService {
  constructor(
    private readonly admin: SupabaseAdminService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AvatarService.name);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<{ avatarUrl: string }> {
    if (!this.admin.isConfigured) throw avatarStorageUnavailable();
    if (!file || !file.buffer || file.size === 0) throw avatarMissing();
    if (file.size > AVATAR_MAX_SIZE_BYTES) throw avatarTooLarge(file.size);

    const candidates = filetypeinfo(file.buffer);
    const detectedMime = candidates
      .map((candidate) => candidate.mime)
      .find(
        (mime): mime is AvatarMime =>
          typeof mime === 'string' &&
          AVATAR_ALLOWED_MIME.includes(mime as AvatarMime),
      );
    if (!detectedMime) throw invalidAvatarType();

    let processed: Buffer;
    let originalWidth: number | null = null;
    let originalHeight: number | null = null;
    try {
      const metadata = await sharp(file.buffer, { failOn: 'error' }).metadata();
      originalWidth = metadata.width ?? null;
      originalHeight = metadata.height ?? null;

      const width = originalWidth ?? 0;
      const height = originalHeight ?? 0;
      if (
        width < AVATAR_MIN_DIMENSION ||
        height < AVATAR_MIN_DIMENSION ||
        width > AVATAR_MAX_DIMENSION ||
        height > AVATAR_MAX_DIMENSION
      ) {
        throw avatarDimensionsInvalid({ width, height });
      }

      processed = await sharp(file.buffer, { failOn: 'error' })
        .rotate()
        .resize(AVATAR_OUTPUT_DIMENSION, AVATAR_OUTPUT_DIMENSION, {
          fit: 'cover',
          position: 'attention',
        })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    } catch (error) {
      if (error instanceof DomainException) throw error;
      throw invalidAvatarType();
    }

    const storagePath = `${userId}/${STORED_OBJECT_FILENAME}`;
    const upload = await this.admin.storageClient.storage
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

    const avatarUrl = await this.createSignedUrl(storagePath);
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
    return { avatarUrl };
  }

  async deleteAvatar(userId: string): Promise<void> {
    if (!this.admin.isConfigured) throw avatarStorageUnavailable();

    const path = await this.admin.getAvatarPath(userId);
    if (!path) return;

    const remove = await this.admin.storageClient.storage
      .from(BUCKET)
      .remove([path]);
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

  async resolveSignedUrl(userId: string): Promise<string | null> {
    if (!this.admin.isConfigured) return null;

    const path = await this.admin.getAvatarPath(userId);
    if (!path) return null;

    return this.createSignedUrl(path);
  }

  private async createSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.admin.storageClient.storage
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
