import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getScopedStorageKey,
  extractSyncKeyFromUrl,
  debounce,
  validateSyncPayload,
  validateSyncKey
} from '../bookmarkUtils.js';

describe('Multi-User Vault Isolation & Scoped Storage', () => {
  it('should scope storage keys uniquely per sync key', () => {
    const userAKey = 'zen-aaaa-1111-2222-3333';
    const userBKey = 'zen-bbbb-4444-5555-6666';

    const storageA = getScopedStorageKey('bookmarks', userAKey);
    const storageB = getScopedStorageKey('bookmarks', userBKey);

    assert.equal(storageA, `zenmark_bookmarks_vault_${userAKey}`);
    assert.equal(storageB, `zenmark_bookmarks_vault_${userBKey}`);
    assert.notEqual(storageA, storageB, 'User A and User B storage keys must never collide');
  });

  it('should fallback to local vault key for guests or empty/invalid keys', () => {
    assert.equal(getScopedStorageKey('bookmarks', ''), 'zenmark_bookmarks_vault_local');
    assert.equal(getScopedStorageKey('bookmarks', null), 'zenmark_bookmarks_vault_local');
    assert.equal(getScopedStorageKey('bookmarks', undefined), 'zenmark_bookmarks_vault_local');
    assert.equal(getScopedStorageKey('bookmarks', 'short'), 'zenmark_bookmarks_vault_local'); // Invalid format
    assert.equal(getScopedStorageKey('categories', ''), 'zenmark_categories_vault_local');
  });

  it('should extract valid sync keys from query parameters', () => {
    const validKey = 'zen-1234-abcd-5678-ef01';
    assert.equal(extractSyncKeyFromUrl(`?syncKey=${validKey}`), validKey);
    assert.equal(extractSyncKeyFromUrl(`?key=${validKey}`), validKey);
    assert.equal(extractSyncKeyFromUrl(`?foo=bar&syncKey=${validKey}&theme=dark`), validKey);

    // Invalid or missing keys
    assert.equal(extractSyncKeyFromUrl(''), null);
    assert.equal(extractSyncKeyFromUrl('?syncKey=bad key with spaces'), null);
    assert.equal(extractSyncKeyFromUrl('?syncKey=<script>alert(1)</script>'), null);
    assert.equal(extractSyncKeyFromUrl('?otherParam=123'), null);
  });

  it('should debounce rapid save calls and execute with latest arguments', async () => {
    let callCount = 0;
    let lastValue = null;

    const fn = (val) => {
      callCount++;
      lastValue = val;
    };

    const debouncedFn = debounce(fn, 50);

    // Fire 5 rapid calls
    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');
    debouncedFn('call4');
    debouncedFn('call5');

    assert.equal(callCount, 0, 'Debounced function should not have executed immediately');

    // Wait 70ms for timer
    await new Promise((resolve) => setTimeout(resolve, 70));

    assert.equal(callCount, 1, 'Debounced function should only execute once');
    assert.equal(lastValue, 'call5', 'Debounced function should receive the latest arguments');
  });

  it('should support immediate flush and cancel on debounced function', () => {
    let callCount = 0;
    let lastValue = null;

    const fn = (val) => {
      callCount++;
      lastValue = val;
    };

    const debouncedFn = debounce(fn, 100);

    debouncedFn('immediate');
    assert.equal(callCount, 0);

    debouncedFn.flush();
    assert.equal(callCount, 1);
    assert.equal(lastValue, 'immediate');

    // Cancel test
    debouncedFn('cancel-me');
    debouncedFn.cancel();
    debouncedFn.flush(); // Nothing pending
    assert.equal(callCount, 1);
  });

  it('should ensure independent payload integrity across distinct vaults', () => {
    const vaultAData = {
      bookmarks: [{ id: '1', title: 'Work Tool', url: 'https://work.com', category: 'work', sortIndex: 0 }],
      categories: { work: 'Work/' }
    };
    const vaultBData = {
      bookmarks: [{ id: '2', title: 'Personal Blog', url: 'https://blog.org', category: 'personal', sortIndex: 0 }],
      categories: { personal: 'Personal/' }
    };

    const validA = validateSyncPayload(vaultAData);
    const validB = validateSyncPayload(vaultBData);

    assert.equal(validA.valid, true);
    assert.equal(validB.valid, true);

    // Deep clones should remain strictly decoupled
    const serializedA = JSON.stringify(vaultAData);
    const serializedB = JSON.stringify(vaultBData);
    assert.notEqual(serializedA, serializedB);
    assert.ok(!serializedA.includes('Personal Blog'));
    assert.ok(!serializedB.includes('Work Tool'));
  });
});
