/**
 * Typed fetch wrapper for API routes.
 */

import type { ApiResponse } from '@/lib/api-response';

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

/** Build a URL with optional query params. */
function buildUrl(path: string, params?: FetchOptions['params']): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = new URL(path, base);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/** Typed fetch — parses the ApiResponse envelope. */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...init } = options;
  const url = buildUrl(path, params);

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error ?? 'Unknown API error');
  }

  return json.data;
}
