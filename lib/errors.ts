/**
 * Application error types.
 * Throw these from services/repositories; route handlers catch and convert them.
 */

export type HttpStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500;

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: HttpStatus = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} "${id}" not found` : `${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/** Narrow an unknown catch value to an Error-like object. */
export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}
