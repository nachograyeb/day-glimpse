import { NextRequest } from 'next/server';

const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

export const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 5,      // max 5 requests per minute
  maxFileSize: 5 * 1024 * 1024, // 5MB max file size
};

export function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return `upload:${ip}`;
}

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data) {
    rateLimitStore.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (now - data.timestamp > RATE_LIMIT.windowMs) {
    rateLimitStore.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (data.count < RATE_LIMIT.maxRequests) {
    data.count++;
    return true;
  }

  return false;
}
