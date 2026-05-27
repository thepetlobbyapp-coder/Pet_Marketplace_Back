import { Global, Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AuditLogger } from './audit.logger';

@Global()
@Module({
  imports: [CommonModule],
  providers: [AuditLogger],
  exports: [AuditLogger],
})
export class AuditModule {}
