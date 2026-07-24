import { type NextRequest } from 'next/server';
import { apiSuccess, apiError, withHandler, type RouteContext } from '@/lib/api-response';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';

/**
 * GET /api/example
 * Example list endpoint with pagination.
 */
export const GET = withHandler(async (request: NextRequest, _ctx: RouteContext) => {
  const { searchParams } = request.nextUrl;
  const { page, limit }  = parsePagination(searchParams);

  const items: unknown[] = [];
  const total = 0;

  return apiSuccess(buildPaginatedResponse(items, total, { page, limit }));
});

/**
 * POST /api/example
 * Example create endpoint.
 */
export const POST = withHandler(async (request: NextRequest, _ctx: RouteContext) => {
  const body: unknown = await request.json();

  if (!body || typeof body !== 'object') {
    return apiError('Invalid request body', 400);
  }

  return apiSuccess({ created: true }, 'Resource created', 201);
});
