import type { PaginationParams, PaginatedResponse } from '@/types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Parse and clamp pagination query params from a URL. */
export function parsePagination(searchParams: URLSearchParams): Required<PaginationParams> {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );
  return { page, limit };
}

/** Calculate Prisma-compatible skip/take from pagination params. */
export function paginationToSkipTake({ page, limit }: Required<PaginationParams>): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * limit, take: limit };
}

/** Build a paginated response envelope. */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  { page, limit }: Required<PaginationParams>,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
