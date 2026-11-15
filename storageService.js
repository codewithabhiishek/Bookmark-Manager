/**
 * storageService.js
 * Multi-user and multi-vault scoped storage engine for Bookmark-Manager.
 * Prevents vault collision, cross-user cache leaks, and race conditions.
 */

/**
 * Validates whether a sync key conforms to the secure vault pattern.
 * @param {string} key
 * @returns {boolean}
 */
export function validateSyncKey(key) {
  if (!key || typeof key !== 'string') return false;
  return /^[a-zA-Z0-9_-]{8,64}$/.test(key.trim());
}

/**
 * Scoped storage keys ensuring multiple users / vaults never collide or mix data.
 * @param {'bookmarks' | 'categories' | 'profile'} type
 * @param {string} [syncKey]
 * @returns {string}
 */
export function getScopedStorageKey(type, syncKey = '') {
  const cleanKey = typeof syncKey === 'string' ? syncKey.trim() : '';
  if (cleanKey && validateSyncKey(cleanKey)) {
    return `zenmark_${type}_vault_${cleanKey}`;
  }
  return `zenmark_${type}_vault_local`;
}

/**
 * Extracts and validates syncKey or key from URL search query string.
 * @param {string} searchString - e.g. "?syncKey=zen-1234-abcd" or "?key=zen-1234-abcd"
 * @returns {string | null} Validated sync key or null
 */
export function extractSyncKeyFromUrl(searchString) {
  if (!searchString || typeof searchString !== 'string') return null;
  try {
    const params = new URLSearchParams(searchString);
    const candidate = params.get('syncKey') || params.get('key') || '';
    const trimmed = candidate.trim();
    if (trimmed && validateSyncKey(trimmed)) {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * High-performance debounce with cancel and flush capabilities.
 * @template T
 * @param {T} fn
 * @param {number} [waitMs=500]
 * @returns {T & { cancel: () => void, flush: () => void }}
 */
export function debounce(fn, waitMs = 500) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, waitMs);
  }

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      fn.apply(lastThis, lastArgs);
    }
  };

  return debounced;
}

/**
 * Creates an isolated localStorage adapter for a specific vault.
 * @param {string} [syncKey='']
 */
export function createScopedVaultStorage(syncKey = '') {
  const cleanKey = typeof syncKey === 'string' ? syncKey.trim() : '';
  const vaultId = cleanKey && validateSyncKey(cleanKey) ? cleanKey : 'local';

  return {
    vaultId,
    getItem(type) {
      if (typeof localStorage === 'undefined') return null;
      try {
        return localStorage.getItem(getScopedStorageKey(type, vaultId === 'local' ? '' : vaultId));
      } catch {
        return null;
      }
    },
    setItem(type, value) {
      if (typeof localStorage === 'undefined') return;
      try {
        const str = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(getScopedStorageKey(type, vaultId === 'local' ? '' : vaultId), str);
      } catch (err) {
        console.warn('Vault storage setItem failed:', err);
      }
    },
    removeItem(type) {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.removeItem(getScopedStorageKey(type, vaultId === 'local' ? '' : vaultId));
      } catch {
        // ignore
      }
    },
  };
}
