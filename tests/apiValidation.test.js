import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSyncPayload } from '../bookmarkUtils.js';

describe('Cloud API Payload & Prototype Pollution Guards', () => {
  it('should accept valid bookmark payloads', () => {
    const payload = {
      bookmarks: [
        { id: '1', title: 'GitHub', url: 'https://github.com', category: 'dev', pinned: true }
      ],
      categories: {
        dev: 'Dev-Tools/',
        personal: 'Personal/'
      }
    };
    const result = validateSyncPayload(payload);
    assert.equal(result.valid, true);
  });

  it('should detect honeypots (botcheck and _gotcha)', () => {
    const botPayload = {
      botcheck: true,
      bookmarks: [],
      categories: {}
    };
    const result = validateSyncPayload(botPayload);
    assert.equal(result.valid, false);
    assert.equal(result.isBot, true);

    const gotchaPayload = {
      _gotcha: 'automated bot fill',
      bookmarks: [],
      categories: {}
    };
    const resultGotcha = validateSyncPayload(gotchaPayload);
    assert.equal(resultGotcha.valid, false);
    assert.equal(resultGotcha.isBot, true);
  });

  it('should block prototype pollution in category keys', () => {
    // Test JSON parsed __proto__ payload
    const jsonProtoPayload = JSON.parse('{"bookmarks":[],"categories":{"__proto__":"malicious","dev":"Dev/"}}');
    const result = validateSyncPayload(jsonProtoPayload);
    assert.equal(result.valid, false);
    assert.match(result.error, /forbidden/i);

    // Test prototype pollution via constructor property
    const constructorPayload = {
      bookmarks: [],
      categories: {
        'constructor': 'malicious'
      }
    };
    assert.equal(validateSyncPayload(constructorPayload).valid, false);

    // Test prototype pollution via prototype property
    const prototypePayload = {
      bookmarks: [],
      categories: {
        'prototype': 'malicious'
      }
    };
    assert.equal(validateSyncPayload(prototypePayload).valid, false);
  });

  it('should reject malformed or dangerous bookmark URLs in payload', () => {
    const payload = {
      bookmarks: [
        { id: '1', title: 'XSS Bookmark', url: 'javascript:alert(1)', category: 'dev' }
      ],
      categories: { dev: 'Dev/' }
    };
    const result = validateSyncPayload(payload);
    assert.equal(result.valid, false);
    assert.match(result.error, /invalid bookmark url/i);
  });

  it('should reject oversized payloads', () => {
    const largeBookmarks = Array.from({ length: 5001 }, (_, i) => ({
      id: String(i),
      title: `Title ${i}`,
      url: `https://example.com/${i}`,
      category: 'dev'
    }));
    const payload = {
      bookmarks: largeBookmarks,
      categories: { dev: 'Dev/' }
    };
    const result = validateSyncPayload(payload);
    assert.equal(result.valid, false);
    assert.match(result.error, /too large/i);
  });
});
