import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv, type Env } from './env.schema';

/**
 * Tipagem forte do ConfigService em todo o backend.
 */
export type AppConfigService = ConfigService<Env, true>;

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      validate: validateEnv,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
