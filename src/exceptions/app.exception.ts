import { HttpException, HttpStatus } from '@nestjs/common';  
import {
  ErrorCatalog,
  ErrorCode,
  STATUS_TO_CODE,
} from '../common/constants/response-messages';

interface Options {
  entity?: string;
  message?: string | string[];
}

function resolve(a: string, b?: number | Options, c?: string) {
  // Legacy: new AppException('msg', 401, 'CODE')
  if (typeof b === 'number') {
    return { message: a, status: b, code: c ?? STATUS_TO_CODE[b] ?? 'BAD_REQUEST' };
  }
  // New: new AppException('NOT_FOUND', { entity: 'User' })
  const def = ErrorCatalog[a as ErrorCode];
  return {
    message: b?.message ?? def.message(b?.entity),
    status: def.status as number,
    code: a,
  };
}

export class AppException extends HttpException {
  public readonly errorCode: string;

  constructor(code: ErrorCode, opts?: Options);
  constructor(message: string, status: number, errorCode?: string);
  constructor(a: string, b?: number | Options, c?: string) {
    const r = resolve(a, b, c);
    super({ message: r.message }, r.status);
    this.errorCode = r.code;
  }

  static notFound(entity: string) { return new AppException('NOT_FOUND', { entity }); }
  static duplicate(message: string) { return new AppException('DUPLICATE_RECORD', { message }); }
  static forbidden(message?: string) { return new AppException('FORBIDDEN', message ? { message } : undefined); }
  static invalidCredentials() { return new AppException('INVALID_CREDENTIALS'); }
  static conflict(message?: string) { return new AppException('CONFLICT', { message }); }
  static badRequest(message: string) { return new AppException(message, HttpStatus.BAD_REQUEST); }   // NEW
}