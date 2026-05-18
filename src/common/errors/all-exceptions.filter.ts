import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ErrorCode, type ApiErrorBody } from './error-codes';
import { DomainException } from './domain.exception';

/**
 * Filtro global de exceções (D-007).
 * Toda resposta de erro segue { error: { code, message, details } }.
 * Nunca expõe stack/PII no corpo.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, code, message, details } = this.normalise(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        { code, status, path: req.url, method: req.method },
        message,
      );
    } else {
      this.logger.warn({ code, status, path: req.url }, message);
    }

    const body: ApiErrorBody = { error: { code, message, details } };
    res.status(status).json(body);
  }

  private normalise(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details: Record<string, unknown>;
  } {
    if (exception instanceof DomainException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ErrorCode.RATE_LIMITED,
        message: 'Too many requests. Please try again later.',
        details: {},
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      const message =
        typeof resp === 'string'
          ? resp
          : ((resp as { message?: unknown }).message ?? exception.message);
      return {
        status,
        code: this.codeForStatus(status),
        message: Array.isArray(message)
          ? message.join('; ')
          : String(message),
        details: {},
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred.',
      details: {},
    };
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.BUSINESS_RULE_VIOLATION;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
