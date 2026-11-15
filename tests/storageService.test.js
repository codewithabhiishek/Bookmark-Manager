import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSyncKey,
  getScopedStorageKey,
  extractSyncKeyFromUrl,
  debounce,
  createScopedVaultStorage
} from '../storageService.js';

describe('StorageService & Vault Scoping', () => {
  it('validates sync key formatting correctly', () => {
    assert.equal(validateSyncKey('zen-1234-abcd-5678'), true);
    assert.equal(validateSyncKey('vault_alpha_99'), true);
    assert.equal(validateSyncKey('short'), false); // Too short (< 8 chars)
    assert.equal(validateSyncKey(''), false);
    assert.equal(validateSyncKey(null), false);
    assert.equal(validateSyncKey('invalid key with spaces'), false);
    assert.equal(validateSyncKey('<script>alert(1)</script>'), false);
  });

  it('generates strictly isolated storage keys for distinct vaults', () => {
    const keyAlpha = 'zen-aaaa-1111-2222';
    const keyBeta = 'zen-bbbb-3333-4444';

    const bAlpha = getScopedStorageKey('bookmarks', keyAlpha);
    const bBeta = getScopedStorageKey('bookmarks', keyBeta);
    const bLocal = getScopedStorageKey('bookmarks', '');

    assert.equal(bAlpha, `zenmark_bookmarks_vault_${keyAlpha}`);
    assert.equal(bBeta, `zenmark_bookmarks_vault_${keyBeta}`);
    assert.equal(bLocal, 'zenmark_bookmarks_vault_local');
    assert.notEqual(bAlpha, bBeta);
  });

  it('extracts valid sync keys from various search string formats', () => {
    const validKey = 'zen-9999-xxxx-0000';
    assert.equal(extractSyncKeyFromUrl(`?syncKey=${validKey}`), validKey);
    assert.equal(extractSyncKeyFromUrl(`?key=${validKey}`), validKey);
    assert.equal(extractSyncKeyFromUrl(`?a=1&syncKey=${validKey}&b=2`), validKey);
    assert.equal(extractSyncKeyFromUrl('?syncKey=bad'), null);
    assert.equal(extractSyncKeyFromUrl(''), null);
  });

  describe('createScopedVaultStorage', () => {
    const mockStore = new Map();
    const originalLocalStorage = global.localStorage;

    beforeEach(() => {
      mockStore.clear();
      global.localStorage = {
        getItem: (k) => mockStore.get(k) ?? null,
        setItem: (k, v) => mockStore.set(k, String(v)),
        removeItem: (k) => mockStore.delete(k),
        clear: () => mockStore.clear()
      };
    });

    it('isolates data between distinct vaults using the adapter', () => {
      const storageA = createScopedVaultStorage('zen-aaaa-1111-2222');
      const storageB = createScopedVaultStorage('zen-bbbb-3333-4444');

      assert.equal(storageA.vaultId, 'zen-aaaa-1111-2222');
      assert.equal(storageB.vaultId, 'zen-bbbb-3333-4444');

      storageA.setItem('bookmarks', [{ id: '1', title: 'A Bookmark' }]);
      storageB.setItem('bookmarks', [{ id: '2', title: 'B Bookmark' }]);

      const loadedA = JSON.parse(storageA.getItem('bookmarks'));
      const loadedB = JSON.parse(storageB.getItem('bookmarks'));

      assert.equal(loadedA[0].title, 'A Bookmark');
      assert.equal(loadedB[0].title, 'B Bookmark');

      storageA.removeItem('bookmarks');
      assert.equal(storageA.getItem('bookmarks'), null);
      assert.notEqual(storageB.getItem('bookmarks'), null);
    });

    it('handles SSR safely when localStorage is undefined', () => {
      delete global.localStorage;
      const storage = createScopedVaultStorage('zen-local-test-key');

      assert.doesNotThrow(() => {
        assert.equal(storage.getItem('bookmarks'), null);
        storage.setItem('bookmarks', 'val');
        storage.removeItem('bookmarks');
      });
    });
  });
});
