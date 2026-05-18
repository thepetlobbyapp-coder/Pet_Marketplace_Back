import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import type { Env } from '../../config/env.schema';

/**
 * Logging estruturado pino (D-008) com redaction de PII.
 * Nunca logar: authorization, senha, token, e-mail, telefone, corpo de mensagem.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.token',
                'req.body.email',
                'req.body.phone',
                'req.body.body',
                '*.password',
                '*.token',
                '*.email',
                '*.phone',
              ],
              censor: '[redacted]',
            },
            // Não logar o corpo das requisições por padrão (pode conter PII).
            serializers: {
              req(req: { method: string; url: string; id?: string }) {
                return { method: req.method, url: req.url, id: req.id };
              },
            },
            autoLogging: {
              ignore: (req: { url?: string }) =>
                req.url === '/api/v1/health',
            },
            transport: isProd
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}
