import { Module } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [AvatarService],
})
export class UsersModule {}
