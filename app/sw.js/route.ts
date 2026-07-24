import { NextResponse } from 'next/server';

/**
 * Explicitly handle GET /sw.js to prevent 404 log noise.
 * This project does not use a service worker / PWA.
 */
export function GET() {
  return new NextResponse(null, { status: 404 });
}
