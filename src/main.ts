import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';

const API_PREFIX = 'api/v1';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());

  const originsRaw = config.get('CORS_ALLOWED_ORIGINS', { infer: true });
  const origin = originsRaw
    ? originsRaw.split(',').map((o) => o.trim())
    : [config.get('API_BASE_URL', { infer: true })];
  app.enableCors({ origin, credentials: true });

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Pet Marketplace API')
        .setDescription('Fase 1 — sem pagamento. en-GB.')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, doc);
  }

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
