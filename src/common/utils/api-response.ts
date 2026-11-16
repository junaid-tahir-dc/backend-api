export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  message: string;
  path: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  data: Record<string, never>;
  message: string | string[];
  errorCode: string;
  path: string;
  timestamp: string;
}

export const buildSuccess = <T>(
  statusCode: number, data: T, message: string, path: string,
): ApiSuccessResponse<T> => ({
  success: true, statusCode, data: data ?? ({} as T), message, path,
  timestamp: new Date().toISOString(),
});

export const buildError = (
  statusCode: number, message: string | string[], errorCode: string, path: string,
): ApiErrorResponse => ({
  success: false, statusCode, data: {}, message, errorCode, path,
  timestamp: new Date().toISOString(),
});