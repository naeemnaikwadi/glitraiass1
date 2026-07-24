import { type NextRequest, NextResponse } from 'next/server';
import { AppError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// ─── Envelope types ───────────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Builders ─────────────────────────────────────────────────────────────────

export function apiSuccess<T>(
  data: T,
  message?: string,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function apiError(
  error: string,
  status = 400,
  details?: unknown,
  code?: string,
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error, code, details }, { status });
}

// ─── Route context type (Next.js dynamic segments) ───────────────────────────

export type RouteContext<P extends Record<string, string> = Record<string, string>> = {
  params: Promise<P>;
};

// ─── Centralized route error handler ─────────────────────────────────────────

/**
 * Wraps an async route handler with centralized error handling.
 *
 * Next.js requires route handlers to have the exact signature
 *   (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>
 * so withHandler always passes both arguments.
 *
 * Catches:
 *   ValidationError → 422 with per-field details
 *   AppError        → mapped HTTP status
 *   anything else   → 500 + server log
 */
export function withHandler<P extends Record<string, string> = Record<string, string>>(
  handler: (req: NextRequest, ctx: RouteContext<P>) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ctx: RouteContext<P>): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ValidationError) {
        return apiError(err.message, err.status, err.fields, err.code);
      }
      if (err instanceof AppError) {
        return apiError(err.message, err.status, undefined, err.code);
      }
      logger.error('Unhandled route error', 'withHandler', err);
      return apiError('Internal server error', 500, undefined, 'INTERNAL_ERROR');
    }
  };
}
