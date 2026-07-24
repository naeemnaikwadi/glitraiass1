/**
 * Lightweight className merger (no external dependency).
 * Filters falsy values and joins with a space.
 *
 * For a full-featured version, install `clsx` + `tailwind-merge`.
 */
export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
