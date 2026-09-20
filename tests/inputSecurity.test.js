import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripTags,
  escapeHTML,
  formatBookmarkTitle,
  formatCategoryName,
  getCategoryColor,
  generateSecureKey,
  validateSyncKey
} from '../bookmarkUtils.js';

describe('Input Security & Data Formatting', () => {
  it('should strip HTML tags and script injection attempts', () => {
    assert.equal(stripTags('<script>alert("xss")</script>Hello'), 'Hello');
    assert.equal(stripTags('<img src=x onerror=alert(1)>Test'), 'Test');
    assert.equal(stripTags('<b>Bold</b> & <i>Italic</i>'), 'Bold & Italic');
    assert.equal(stripTags(null), '');
    assert.equal(stripTags(undefined), '');
  });

  it('should escape HTML entities for DOM rendering', () => {
    assert.equal(escapeHTML('<div>"Hello" & \'World\'</div>'), '&lt;div&gt;&quot;Hello&quot; &amp; &#39;World&#39;&lt;/div&gt;');
    assert.equal(escapeHTML(null), '');
    assert.equal(escapeHTML(undefined), '');
  });

  it('should format bookmark titles and enforce title boundaries', () => {
    assert.equal(formatBookmarkTitle('my cool web app'), 'My Cool Web App');
    assert.equal(formatBookmarkTitle('<script>xss</script>github repo'), 'Github Repo');
    assert.equal(formatBookmarkTitle(''), '');
    assert.equal(formatBookmarkTitle(null), '');

    const superLong = 'a'.repeat(400);
    assert.ok(formatBookmarkTitle(superLong).length <= 300);
  });

  it('should format category names, append trailing slash, and neutralize prototype pollution', () => {
    assert.equal(formatCategoryName('dev tools'), 'Dev Tools/');
    assert.equal(formatCategoryName('design///'), 'Design/');
    assert.equal(formatCategoryName('learning/'), 'Learning/');
    assert.equal(formatCategoryName('<script>alert(1)</script>Personal'), 'Personal/');

    // Prototype pollution prevention
    assert.equal(formatCategoryName('__proto__'), 'Safe-Category/');
    assert.equal(formatCategoryName('constructor'), 'Safe-Category/');
    assert.equal(formatCategoryName('prototype'), 'Safe-Category/');

    // Empty / whitespace fallback
    assert.equal(formatCategoryName(''), 'General/');
    assert.equal(formatCategoryName('///'), 'General/');
    assert.equal(formatCategoryName(null), 'General/');
  });

  it('should consistently hash category keys to retro colors', () => {
    const color1 = getCategoryColor('dev');
    const color2 = getCategoryColor('dev');
    assert.equal(color1, color2);
    assert.ok(typeof color1 === 'string' && color1.length > 0);

    // Fallback on null/empty
    assert.ok(typeof getCategoryColor(null) === 'string');
  });

  it('should generate and validate secure sync keys', () => {
    const key = generateSecureKey();
    assert.match(key, /^zen-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}$/);
    assert.equal(validateSyncKey(key), true);

    // Test valid and invalid keys
    assert.equal(validateSyncKey('my_secret_key_1234'), true);
    assert.equal(validateSyncKey('short'), false); // Too short (< 8 chars)
    assert.equal(validateSyncKey('key with spaces'), false);
    assert.equal(validateSyncKey('key<script>'), false);
    assert.equal(validateSyncKey(null), false);
  });
});
