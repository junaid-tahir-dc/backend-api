import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { AppException } from '../../exceptions/app.exception';
import {
  ErrorCatalog,
  ErrorCode,
  STATUS_TO_CODE,
} from '../constants/response-messages';
import { buildError } from '../utils/api-response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, message, errorCode } = this.resolve(exception);

    if (status >= 500) {
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(`${req.method} ${req.url} -> ${err.message}`, err.stack);
    }

    res.status(status).json(buildError(status, message, errorCode, req.url));
  }

  private resolve(ex: unknown): { status: number; message: string | string[]; errorCode: ErrorCode } {
    const fromCode = (code: ErrorCode, entity?: string) => ({
      status: ErrorCatalog[code].status as number,
      message: ErrorCatalog[code].message(entity) as string,
      errorCode: code,
    });

    if (ex instanceof AppException) {
      return {
        status: ex.getStatus(),
        message: this.extractMessage(ex),
        errorCode: (ex.errorCode as ErrorCode | undefined) ?? 'INTERNAL_ERROR',
      };
    }

    if (ex instanceof Prisma.PrismaClientKnownRequestError) {
      switch (ex.code) {
        case 'P2002': {
          const target = ex.meta?.target;
          const field = Array.isArray(target) ? target.join(', ') : 'value';
          return { ...fromCode('DUPLICATE_RECORD', field), message: `A record with this ${field} already exists.` };
        }
        case 'P2025': return fromCode('RECORD_NOT_FOUND');
        case 'P2003': return fromCode('REFERENCE_ERROR');
        case 'P2014': return fromCode('CONSTRAINT_ERROR');
        case 'P2024': return fromCode('DB_TIMEOUT');
        case 'P1001':
        case 'P1002': return fromCode('DB_UNAVAILABLE');
        default:      return fromCode('DATABASE_ERROR');
      }
    }

    if (ex instanceof Prisma.PrismaClientValidationError) return fromCode('VALIDATION_FAILED');
    if (ex instanceof Prisma.PrismaClientInitializationError) return fromCode('DB_UNAVAILABLE');
    if (ex instanceof Prisma.PrismaClientUnknownRequestError) return fromCode('DATABASE_ERROR');

    if (ex instanceof HttpException) {
      const status = ex.getStatus();
      const message = this.extractMessage(ex);
      const errorCode: ErrorCode =
        status === 400 && Array.isArray(message)
          ? 'VALIDATION_FAILED'
          : STATUS_TO_CODE[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
      return { status, message, errorCode };
    }

    if (ex instanceof Error && ex.name === 'TokenExpiredError') return fromCode('TOKEN_EXPIRED');
    if (ex instanceof Error && ex.name === 'JsonWebTokenError') return fromCode('UNAUTHORIZED');

    return fromCode('INTERNAL_ERROR');
  }

  private extractMessage(ex: HttpException): string | string[] {
    const r = ex.getResponse();
    if (typeof r === 'string') return r;
    const m = (r as { message?: string | string[] }).message;
    return m ?? ex.message;
  }
}