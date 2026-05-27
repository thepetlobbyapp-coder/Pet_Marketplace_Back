import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

export interface AuditEvent {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
}

const ALLOWED_METADATA_KEYS = new Set([
  'category',
  'conversationId',
  'status',
  'targetType',
]);

/**
 * Base de auditoria de acoes sensiveis (docs/02 section 5.14).
 * Registra via log estruturado e persiste em `audit_logs`. Nao logar PII.
 */
@Injectable()
export class AuditLogger {
  constructor(
    private readonly logger: PinoLogger,
    private readonly admin: SupabaseAdminService,
  ) {
    this.logger.setContext('Audit');
  }

  async record(event: AuditEvent): Promise<void> {
    const metadata = sanitizeAuditMetadata(event.metadata);

    this.logger.info(
      {
        audit: true,
        actorUserId: event.actorUserId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata,
      },
      'audit_event',
    );

    await this.admin.appendAuditLog({
      action: event.action,
      actorUserId: event.actorUserId,
      metadata,
      targetId: event.entityId,
      targetType: event.entityType,
    });
  }
}

function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> {
  if (!metadata) return {};

  return Object.fromEntries(
    Object.entries(metadata).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const [key, value] = entry;
        return ALLOWED_METADATA_KEYS.has(key) && isAuditMetadataScalar(value);
      },
    ),
  );
}

function isAuditMetadataScalar(
  value: unknown,
): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
