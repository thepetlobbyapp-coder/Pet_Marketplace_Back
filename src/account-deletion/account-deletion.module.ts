import { Module } from '@nestjs/common';
import { AccountDeletionController } from './account-deletion.controller';

@Module({ controllers: [AccountDeletionController] })
export class AccountDeletionModule {}
