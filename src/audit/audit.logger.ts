import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export interface AuditEvent {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Base de auditoria de ações sensíveis (docs/02 §5.14).
 * Fase 1/Bloco 1: registra via log estruturado. A persistência em tabela
 * audit_logs entra no Bloco 2 (banco/migrations). Não logar PII.
 */
@Injectable()
export class AuditLogger {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('Audit');
  }

  record(event: AuditEvent): void {
    this.logger.info(
      {
        audit: true,
        actorUserId: event.actorUserId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata ?? {},
      },
      'audit_event',
    );
  }
}
