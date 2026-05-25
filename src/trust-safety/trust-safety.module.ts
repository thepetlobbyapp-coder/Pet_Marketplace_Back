import { Module } from '@nestjs/common';
import { TrustSafetyController } from './trust-safety.controller';

@Module({ controllers: [TrustSafetyController] })
export class TrustSafetyModule {}
