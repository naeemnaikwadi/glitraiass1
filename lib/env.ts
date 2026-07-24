/**
 * Validated, typed environment variables.
 * Throws at startup if required variables are missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // App
  APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  APP_NAME: optionalEnv('NEXT_PUBLIC_APP_NAME', 'App'),

  // API
  API_SECRET_KEY: requireEnv('API_SECRET_KEY'),

  // Gemini
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY:    requireEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),

  // Node
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;
