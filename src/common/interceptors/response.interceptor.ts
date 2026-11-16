import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success-message.decorator';
import { ApiSuccessResponse, buildSuccess } from '../utils/api-response';

const DEFAULT_MESSAGES: Record<string, string> = {
  GET: 'Request completed successfully.',
  POST: 'Created successfully.',
  PUT: 'Updated successfully.',
  PATCH: 'Updated successfully.',
  DELETE: 'Deleted successfully.',
};

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const res = http.getResponse();
    const req = http.getRequest();

    const message =
      this.reflector.getAllAndOverride<string>(SUCCESS_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_MESSAGES[req.method] ?? 'Success.';

    return next.handle().pipe(
      map((data) => buildSuccess(res.statusCode, data, message, req.url)),
    );
  }
}