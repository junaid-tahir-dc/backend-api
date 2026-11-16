import { HttpStatus } from '@nestjs/common';

/** Success messages (entity-based) */
export const ResponseMessage = {
  get: (e: string) => `${e} retrieved successfully.`,
  list: (plural: string) => `${plural} retrieved successfully.`,
  created: (e: string) => `${e} created successfully.`,
  updated: (e: string) => `${e} updated successfully.`,
  statusUpdated: (e: string) => `${e} status updated successfully.`,
  deleted: (e: string) => `${e} deleted successfully.`,
  deletionRequested: () => 'Deletion request sent to admin for review.',
  logoutSuccess: () => 'Logged out successfully.',
  loginSuccess: () => 'Login successful.',
  tokenRefreshed: () => 'Token refreshed successfully.',
} as const;

/** Every error: code -> status + message. Add new ones here only. */
export const ErrorCatalog = {

  
  // generic HTTP
  BAD_REQUEST:        { status: HttpStatus.BAD_REQUEST, message: () => 'Bad request.' },
  VALIDATION_FAILED:  { status: HttpStatus.BAD_REQUEST, message: () => 'Please check your input and try again.' },
  UNAUTHORIZED:       { status: HttpStatus.UNAUTHORIZED, message: () => 'Authentication required.' },
  INVALID_CREDENTIALS:{ status: HttpStatus.UNAUTHORIZED, message: () => 'You have entered invalid email or password' },
  TOKEN_EXPIRED:      { status: HttpStatus.UNAUTHORIZED, message: () => 'Session expired. Please log in again.' },
  FORBIDDEN:          { status: HttpStatus.FORBIDDEN, message: () => 'You do not have permission to perform this action.' },
  NOT_FOUND:          { status: HttpStatus.NOT_FOUND, message: (e = 'Resource') => `${e} not found.` },
  CONFLICT:           { status: HttpStatus.CONFLICT, message: () => 'Request conflicts with the current state.' },
  TOO_MANY_REQUESTS:  { status: HttpStatus.TOO_MANY_REQUESTS, message: () => 'Too many requests. Please slow down.' },

  // database
  DUPLICATE_RECORD:   { status: HttpStatus.CONFLICT, message: (e = 'record') => `This ${e.toLowerCase()} already exists.` },
  RECORD_NOT_FOUND:   { status: HttpStatus.NOT_FOUND, message: (e = 'Record') => `${e} not found.` },
  REFERENCE_ERROR:    { status: HttpStatus.CONFLICT, message: () => 'Cannot complete: referenced by another record.' },
  CONSTRAINT_ERROR:   { status: HttpStatus.BAD_REQUEST, message: () => 'Operation failed due to related data constraints.' },
  DB_TIMEOUT:         { status: HttpStatus.SERVICE_UNAVAILABLE, message: () => 'Operation timed out. Please try again.' },
  DB_UNAVAILABLE:     { status: HttpStatus.SERVICE_UNAVAILABLE, message: () => 'Service temporarily unavailable.' },
  DATABASE_ERROR:     { status: HttpStatus.INTERNAL_SERVER_ERROR, message: () => 'Database error occurred. Please contact support.' },

  INTERNAL_ERROR:     { status: HttpStatus.INTERNAL_SERVER_ERROR, message: () => 'Sorry, something went wrong. Please try again in a moment.' },
} as const;

export type ErrorCode = keyof typeof ErrorCatalog;

/** Fallback when a plain HttpException has no custom code */
export const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
};