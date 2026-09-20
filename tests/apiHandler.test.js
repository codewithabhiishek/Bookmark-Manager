import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/bookmarks.js';

describe('Edge API Bookmarks Handler', () => {
  it('should handle OPTIONS preflight request', async () => {
    const req = new Request('https://example.com/api/bookmarks', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://my-domain.vercel.app'
      }
    });

    const res = await handler(req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://my-domain.vercel.app');
  });

  it('should return 401 when sync key is missing', async () => {
    process.env.KV_REST_API_URL = 'https://fake-kv.upstash.io';
    process.env.KV_REST_API_TOKEN = 'fake-token';

    const req = new Request('https://example.com/api/bookmarks', {
      method: 'GET'
    });

    const res = await handler(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.error, /unauthorized/i);
  });

  it('should return 400 when sync key is invalid format', async () => {
    process.env.KV_REST_API_URL = 'https://fake-kv.upstash.io';
    process.env.KV_REST_API_TOKEN = 'fake-token';

    const req = new Request('https://example.com/api/bookmarks', {
      method: 'GET',
      headers: {
        'x-sync-key': 'short' // Too short (< 8 chars)
      }
    });

    const res = await handler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /invalid sync key/i);
  });

  it('should detect honeypots in POST and return mock success without saving', async () => {
    process.env.KV_REST_API_URL = 'https://fake-kv.upstash.io';
    process.env.KV_REST_API_TOKEN = 'fake-token';

    const req = new Request('https://example.com/api/bookmarks', {
      method: 'POST',
      headers: {
        'x-sync-key': 'valid_sync_key_12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        botcheck: true,
        bookmarks: [],
        categories: {}
      })
    });

    const res = await handler(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.mock, true);
  });

  it('should reject prototype pollution attempts in categories with 400', async () => {
    process.env.KV_REST_API_URL = 'https://fake-kv.upstash.io';
    process.env.KV_REST_API_TOKEN = 'fake-token';

    const req = new Request('https://example.com/api/bookmarks', {
      method: 'POST',
      headers: {
        'x-sync-key': 'valid_sync_key_12345',
        'Content-Type': 'application/json'
      },
      body: '{"bookmarks":[],"categories":{"__proto__":"polluted"}}'
    });

    const res = await handler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /forbidden/i);
  });

  it('should reject unsupported HTTP methods with 405', async () => {
    process.env.KV_REST_API_URL = 'https://fake-kv.upstash.io';
    process.env.KV_REST_API_TOKEN = 'fake-token';

    const req = new Request('https://example.com/api/bookmarks', {
      method: 'DELETE',
      headers: {
        'x-sync-key': 'valid_sync_key_12345'
      }
    });

    const res = await handler(req);
    assert.equal(res.status, 405);
  });
});
