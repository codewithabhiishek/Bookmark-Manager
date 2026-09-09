export const config = {
  runtime: 'edge',
};

// In-memory sliding window rate limiter for Edge instances
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count++;
  }
  rateLimitMap.set(ip, record);

  // Periodic cleanup to avoid memory leaks
  if (rateLimitMap.size > 2000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  }

  return record.count > MAX_REQUESTS_PER_WINDOW;
}

function resolveAllowedOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return '*'; // Same-origin or direct browser request

  try {
    const { hostname } = new URL(origin);
    const hostHeader = req.headers.get('host') || '';
    const reqHostname = hostHeader.split(':')[0];

    if (
      hostname === reqHostname ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.is-a.dev')
    ) {
      return origin;
    }
  } catch {}

  return 'null';
}

export default async function handler(req) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const allowedOrigin = resolveAllowedOrigin(req);
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-sync-key',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // IP Rate Limiting check
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('x-real-ip') ||
                   'unknown-client';

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down and try again in a minute." }),
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': '60'
        }
      }
    );
  }

  if (!url || !token) {
    return new Response(
      JSON.stringify({ error: "Missing database environment variables." }),
      {
        status: 500,
        headers
      }
    );
  }

  // Extract and validate sync key from header or URL parameter
  const reqUrl = new URL(req.url);
  const rawKey = req.headers.get('x-sync-key') || reqUrl.searchParams.get('syncKey') || '';
  const syncKey = rawKey.trim();

  if (!syncKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Sync key is required to access cloud bookmarks." }),
      { status: 401, headers }
    );
  }

  // Validate key format: 8 to 64 alphanumeric characters, underscores, or hyphens
  const validKeyRegex = /^[a-zA-Z0-9_-]{8,64}$/;
  if (!validKeyRegex.test(syncKey)) {
    return new Response(
      JSON.stringify({ error: "Invalid sync key format. Key must be 8-64 alphanumeric characters, dashes, or underscores." }),
      { status: 400, headers }
    );
  }

  // Multi-tenant scoped key in Redis/KV
  const storageKey = `bookmarks_vault_${syncKey}`;

  if (req.method === 'GET') {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(["GET", storageKey])
      });
      const data = await response.json();
      const payload = data.result ? JSON.parse(data.result) : null;
      return new Response(JSON.stringify(payload), { status: 200, headers });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  }

  if (req.method === 'POST') {
    try {
      const payload = await req.json();

      // Payload validation
      if (!payload || typeof payload !== 'object') {
        return new Response(
          JSON.stringify({ error: "Invalid payload: Expected an object." }),
          { status: 400, headers }
        );
      }

      if (!Array.isArray(payload.bookmarks) || typeof payload.categories !== 'object' || payload.categories === null) {
        return new Response(
          JSON.stringify({ error: "Invalid payload structure: 'bookmarks' must be an array and 'categories' must be an object." }),
          { status: 400, headers }
        );
      }

      if (payload.bookmarks.length > 5000) {
        return new Response(
          JSON.stringify({ error: "Payload too large: Maximum 5000 bookmarks allowed." }),
          { status: 413, headers }
        );
      }

      // Schema validation on bookmark items
      for (let i = 0; i < payload.bookmarks.length; i++) {
        const item = payload.bookmarks[i];
        if (!item || typeof item !== 'object') {
          return new Response(
            JSON.stringify({ error: `Invalid bookmark at index ${i}: Must be an object.` }),
            { status: 400, headers }
          );
        }
        if (typeof item.url !== 'string' || item.url.length > 2048) {
          return new Response(
            JSON.stringify({ error: `Invalid bookmark URL at index ${i}.` }),
            { status: 400, headers }
          );
        }
        if (typeof item.title !== 'string' || item.title.length > 300) {
          return new Response(
            JSON.stringify({ error: `Invalid bookmark title at index ${i}.` }),
            { status: 400, headers }
          );
        }
      }

      const serializedPayload = JSON.stringify(payload);
      if (serializedPayload.length > 2 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "Payload too large: Exceeds 2MB limit." }),
          { status: 413, headers }
        );
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(["SET", storageKey, serializedPayload])
      });
      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers }
  );
}

