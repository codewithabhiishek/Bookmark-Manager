import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeUrl, sanitizeUrl, getGlyphForDomain } from '../bookmarkUtils.js';

describe('URL Sanitization & Protocol Safety', () => {
  it('should accept valid http, https, and mailto URLs', () => {
    assert.equal(isSafeUrl('https://example.com'), true);
    assert.equal(isSafeUrl('http://localhost:3000'), true);
    assert.equal(isSafeUrl('https://sub.domain.org/path?q=1#hash'), true);
    assert.equal(isSafeUrl('mailto:user@example.com'), true);

    assert.equal(sanitizeUrl('https://example.com'), 'https://example.com');
  });

  it('should reject dangerous XSS protocols (javascript, data, vbscript, blob)', () => {
    assert.equal(isSafeUrl('javascript:alert(1)'), false);
    assert.equal(isSafeUrl('JAVASCRIPT:alert(1)'), false);
    assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.equal(isSafeUrl('vbscript:msgbox(1)'), false);
    assert.equal(isSafeUrl('blob:https://example.com/uuid'), false);
    assert.equal(isSafeUrl('file:///etc/passwd'), false);

    assert.equal(sanitizeUrl('javascript:alert(1)'), '#');
    assert.equal(sanitizeUrl('data:text/html;base64,PHNjcmlwdD4='), '#');
    assert.equal(sanitizeUrl('vbscript:msgbox(1)'), '#');
  });

  it('should reject URLs with obfuscated whitespace or control characters', () => {
    assert.equal(isSafeUrl('java\0script:alert(1)'), false);
    assert.equal(isSafeUrl(' java\tscript:alert(1)'), false);
    assert.equal(isSafeUrl('   javascript:alert(1)   '), false);

    assert.equal(sanitizeUrl('java\0script:alert(1)'), '#');
  });

  it('should handle invalid inputs gracefully', () => {
    assert.equal(isSafeUrl(null), false);
    assert.equal(isSafeUrl(undefined), false);
    assert.equal(isSafeUrl(''), false);
    assert.equal(isSafeUrl(12345), false);

    assert.equal(sanitizeUrl(null), '#');
    assert.equal(sanitizeUrl(undefined), '#');
    assert.equal(sanitizeUrl(''), '#');
  });

  it('should return appropriate glyphs for known and fallback domains', () => {
    assert.equal(getGlyphForDomain('https://github.com/torvalds'), '⌥');
    assert.equal(getGlyphForDomain('https://vercel.com/dashboard'), '▲');
    assert.equal(getGlyphForDomain('https://supabase.com'), '⚡');
    assert.equal(getGlyphForDomain('https://chatgpt.com'), '💬');
    assert.equal(getGlyphForDomain('https://claude.ai'), '✿');
    assert.equal(getGlyphForDomain('https://custom-domain.xyz'), 'C');
    assert.equal(getGlyphForDomain(null), '✦');
    assert.equal(getGlyphForDomain('not-a-url'), '✦');
  });
});
