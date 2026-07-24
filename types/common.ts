/**
 * General-purpose utility types.
 */

/** Make specific keys of T optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific keys of T required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Deep partial — all nested properties become optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Extracts the resolved type from a Promise */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/** Dictionary / record shorthand */
export type Dict<T = unknown> = Record<string, T>;

/** A value that may be null or undefined */
export type Nullable<T> = T | null | undefined;

/** Props with optional className */
export type WithClassName<T = object> = T & { className?: string };
