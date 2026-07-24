/**
 * Structured logger.
 * In production, outputs JSON lines. In development, pretty-prints concisely.
 * Drop-in for console.log/error — never throws.
 *
 * Development output is intentionally minimal:
 *   - error.message only (no full stack traces)
 *   - HTTP status and jobId from data when present
 *   - Never prints full API responses
 */

type Level = 'info' | 'warn' | 'error' | 'debug';

type LogEntry = {
  level: Level;
  message: string;
  context?: string;
  data?: unknown;
  error?: string;
  timestamp: string;
};

const isDev = process.env.NODE_ENV !== 'production';

/** Extract only safe, concise fields from data for dev output */
function pickDevData(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  const parts: string[] = [];
  if (d.jobId)      parts.push(`jobId=${d.jobId}`);
  if (d.status)     parts.push(`status=${d.status}`);
  if (d.httpStatus) parts.push(`http=${d.httpStatus}`);
  return parts.length ? ` (${parts.join(', ')})` : '';
}

function serialize(entry: LogEntry): string {
  if (isDev) {
    const level   = entry.level.toUpperCase().padEnd(5);
    const ctx     = entry.context ? ` [${entry.context}]` : '';
    const errPart = entry.error   ? ` — ${entry.error}`   : '';
    const dataPart = pickDevData(entry.data);
    return `${level}${ctx} ${entry.message}${errPart}${dataPart}`;
  }
  // Production: full structured JSON, but never include raw API responses or stack traces
  return JSON.stringify(entry);
}

function log(level: Level, message: string, context?: string, data?: unknown, err?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    context,
    // In dev, only pass safe scalar fields; in prod pass full data
    data: isDev ? (data && typeof data === 'object' ? pickSafeFields(data as Record<string, unknown>) : data) : data,
    timestamp: new Date().toISOString(),
  };

  if (err instanceof Error) {
    // Never include stack traces or raw API responses — message only
    entry.error = err.message;
  } else if (err !== undefined) {
    entry.error = String(err).slice(0, 200); // truncate safety net
  }

  const output = serialize(entry);

  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

/** Keep only known-safe scalar fields; drop any large response objects */
function pickSafeFields(data: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  const allowList = ['jobId', 'status', 'httpStatus', 'attempt', 'delay', 'model'];
  for (const key of allowList) {
    if (key in data) safe[key] = data[key];
  }
  return Object.keys(safe).length ? safe : undefined as unknown as Record<string, unknown>;
}

export const logger = {
  info:  (msg: string, ctx?: string, data?: unknown)               => log('info',  msg, ctx, data),
  warn:  (msg: string, ctx?: string, data?: unknown)               => log('warn',  msg, ctx, data),
  error: (msg: string, ctx?: string, err?: unknown, data?: unknown) => log('error', msg, ctx, data, err),
  debug: (msg: string, ctx?: string, data?: unknown)               => {
    if (isDev) log('debug', msg, ctx, data);
  },
};
