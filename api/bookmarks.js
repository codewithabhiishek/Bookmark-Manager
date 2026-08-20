export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-sync-key',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
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

