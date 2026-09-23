/**
 * Pure utility functions and defensive security guards for Bookmark-Manager.
 * Follows Strix defensive engineering and OWASP standards.
 */

// Colors for category card aesthetics
export const RETRO_COLOR_POOL = [
  'var(--green)', // Neon Green
  'var(--pink)',  // Neon Pink
  'var(--amber)', // Neon Amber
  'var(--cyan)',  // Neon Cyan
  '#c084fc',      // Neon Purple
  '#f97316',      // Neon Orange
  '#94a3b8',      // Retro Silver/Slate
  '#3b82f6',      // Classic Tech Blue
  '#f43f5e',      // Cyberpunk Rose Red
  '#84cc16',      // Neon Lime
  '#0d9488',      // Cyberpunk Teal
  '#d946ef'       // Vivid Magenta
];

// Dangerous prototype keys prohibited to prevent Prototype Pollution
export const FORBIDDEN_OBJECT_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);

/**
 * Strip HTML and script tags from text inputs to prevent XSS / tag injection.
 */
export function stripTags(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * HTML entities escaper for safe DOM insertion.
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
}

/**
 * Validates whether a URL is safe to open/render (prevents javascript:, data:, vbscript: XSS).
 */
export function isSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  // eslint-disable-next-line no-control-regex
  const clean = rawUrl.replace(/[\x00-\x1f\x7f\s]/g, '');
  if (/^(javascript|data|vbscript|blob|file|about):/i.test(clean)) {
    return false;
  }
  try {
    const parsed = new URL(clean, 'https://localhost');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes URLs: returns the trimmed safe URL, or '#' if dangerous/invalid.
 */
export function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  const trimmed = rawUrl.trim();
  // eslint-disable-next-line no-control-regex
  const stripped = trimmed.replace(/[\x00-\x1f\x7f]/g, '');
  if (/^(javascript|data|vbscript|blob|file|about):/i.test(stripped)) {
    return '#';
  }
  try {
    const parsed = new URL(stripped, 'https://localhost');
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return stripped;
    }
  } catch (err) {
    void err;
  }
  return '#';
}

/**
 * Formats bookmark titles with tag stripping, length boundaries, and Title Casing.
 */
export function formatBookmarkTitle(title) {
  if (!title) return '';
  const clean = stripTags(title).slice(0, 300);
  return clean.replace(/\b\w+\b/g, word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Formats category names: strips tags, blocks prototype pollution, ensures trailing slash.
 */
export function formatCategoryName(name) {
  if (!name) return 'General/';
  let cleanName = stripTags(name).replace(/\/+$/, '').trim().slice(0, 50);

  if (FORBIDDEN_OBJECT_KEYS.includes(cleanName.toLowerCase())) {
    return 'Safe-Category/';
  }

  if (!cleanName) {
    return 'General/';
  }

  cleanName = cleanName.replace(/\b\w+\b/g, word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return cleanName + '/';
}

/**
 * Hashes category key into a consistent retro color from the palette pool.
 */
export function getCategoryColor(catKey) {
  if (!catKey || typeof catKey !== 'string') return RETRO_COLOR_POOL[0];
  let hash = 0;
  for (let i = 0; i < catKey.length; i++) {
    hash = catKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % RETRO_COLOR_POOL.length;
  return RETRO_COLOR_POOL[index];
}

/**
 * Generates an unguessable high-entropy sync key using Web Crypto API.
 */
export function generateSecureKey(cryptoObj = (typeof crypto !== 'undefined' ? crypto : null)) {
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `zen-${rnd()}-${rnd()}-${rnd()}-${rnd()}`;
  }
  const bytes = new Uint8Array(8);
  cryptoObj.getRandomValues(bytes);
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `zen-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

/**
 * Validates a sync key format: 8 to 64 alphanumeric characters, underscores, or hyphens.
 */
export function validateSyncKey(key) {
  if (!key || typeof key !== 'string') return false;
  return /^[a-zA-Z0-9_-]{8,64}$/.test(key.trim());
}

/**
 * Defensive domain glyph mapping for visual stickers.
 */
export function getGlyphForDomain(url) {
  if (!url || typeof url !== 'string') return '✦';
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('github')) return '⌥';
    if (host.includes('vercel')) return '▲';
    if (host.includes('supabase')) return '⚡';
    if (host.includes('windsurf') || host.includes('codeium')) return '⌬';
    if (host.includes('figma')) return '◆';
    if (host.includes('google') || host.includes('gmail') || host.includes('mail.google')) return '✉';
    if (host.includes('udemy')) return 'U';
    if (host.includes('youtube')) return '▶';
    if (host.includes('unstop')) return '⎋';
    if (host.includes('chatgpt') || host.includes('openai')) return '💬';
    if (host.includes('claude')) return '✿';
    if (host.includes('firebase')) return '🔥';
    if (host.includes('wooble')) return 'W';
    if (host.includes('coolors')) return '🎨';
    if (host.includes('dribbble')) return '🏀';
    if (host.includes('neal.fun')) return '🎈';
    if (host.includes('pointerpointer')) return '☞';
    if (host.includes('radio.garden')) return '📻';
    if (host.includes('asoftmurmur')) return '🌊';
    if (host.includes('aurabuild')) return '⏏';
    if (host.includes('web3forms')) return '▩';
    if (host.includes('my-portfolio') || host.includes('portfolio')) return '>_';
    if (host.includes('study-os') || host.includes('studyos') || host.includes('mystudy')) return '>_';
    if (host.includes('skillsdirectory') || host.includes('skills')) return '⌘';
    if (host.includes('free-for')) return '🆓';
    if (host.includes('book-vault') || host.includes('bookvault')) return '🔒';
    if (host.includes('fitarena')) return '⚡';
    if (host.includes('college')) return '🎓';
    if (host.includes('traffic')) return '🚥';
    if (host.includes('ev-route') || host.includes('evroute')) return '⚡';
    if (host.includes('cursor')) return '⌖';
    if (host.includes('sudoku')) return '🧩';
    if (host.includes('ice') || host.includes('water')) return '🧊';
    if (host.includes('windows')) return '❖';

    const parts = host.replace(/^www\./, '').split('.');
    const mainName = parts[0] || '';
    return mainName ? mainName.charAt(0).toUpperCase() : '✦';
  } catch {
    return '✦';
  }
}

/**
 * Validates cloud sync payload structure and guards against Prototype Pollution.
 * @returns {{ valid: boolean, error?: string, isBot?: boolean }}
 */
export function validateSyncPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, error: "Invalid payload: Expected an object." };
  }

  // Honeypot detection
  if (payload.botcheck || payload._gotcha) {
    return { valid: false, isBot: true, error: "Bot detected" };
  }

  if (!Array.isArray(payload.bookmarks) || typeof payload.categories !== 'object' || payload.categories === null) {
    return { valid: false, error: "Invalid payload structure: 'bookmarks' must be an array and 'categories' must be an object." };
  }

  // Guard against non-standard prototypes / prototype pollution on payload.categories
  const catProto = Object.getPrototypeOf(payload.categories);
  if (catProto !== Object.prototype && catProto !== null) {
    return { valid: false, error: "Forbidden prototype pollution detected." };
  }

  if (payload.bookmarks.length > 5000) {
    return { valid: false, error: "Payload too large: Maximum 5000 bookmarks allowed." };
  }

  // Prototype pollution validation on categories
  const categoryKeys = Object.getOwnPropertyNames(payload.categories);
  for (const catKey of categoryKeys) {
    if (FORBIDDEN_OBJECT_KEYS.includes(catKey.toLowerCase())) {
      return { valid: false, error: "Forbidden category key detected." };
    }
    if (typeof payload.categories[catKey] !== 'string') {
      return { valid: false, error: `Invalid category value for "${catKey}": must be a string.` };
    }
    if (payload.categories[catKey].length > 100) {
      return { valid: false, error: `Category value too long for "${catKey}".` };
    }
  }

  // Bookmark schema verification
  for (let i = 0; i < payload.bookmarks.length; i++) {
    const item = payload.bookmarks[i];
    if (!item || typeof item !== 'object') {
      return { valid: false, error: `Invalid bookmark at index ${i}: Must be an object.` };
    }
    if (typeof item.url !== 'string' || item.url.length > 2048 || !isSafeUrl(item.url)) {
      return { valid: false, error: `Invalid bookmark URL at index ${i}.` };
    }
    if (typeof item.title !== 'string' || item.title.length > 300) {
      return { valid: false, error: `Invalid bookmark title at index ${i}.` };
    }
  }

  return { valid: true };
}
