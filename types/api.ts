/**
 * Shared API types used across route handlers and client fetches.
 */

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SortDirection = 'asc' | 'desc';

export type SortParams = {
  sortBy?: string;
  sortDir?: SortDirection;
};

export type QueryParams = PaginationParams & SortParams;
