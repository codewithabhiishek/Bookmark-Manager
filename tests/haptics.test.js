import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haptics,
  hapticPatterns,
  isHapticsSupported,
  triggerHaptic
} from '../haptics.js';

test('hapticPatterns contains defined vibration intervals for all actions', () => {
  assert.equal(typeof hapticPatterns.tap, 'number');
  assert.equal(typeof hapticPatterns.select, 'number');
  assert.equal(typeof hapticPatterns.pin, 'number');

  assert.ok(Array.isArray(hapticPatterns.save));
  assert.ok(Array.isArray(hapticPatterns.correct));
  assert.ok(Array.isArray(hapticPatterns.wrong));
  assert.ok(Array.isArray(hapticPatterns.streak));
  assert.ok(Array.isArray(hapticPatterns.complete));
  assert.ok(Array.isArray(hapticPatterns.sync));
  assert.ok(Array.isArray(hapticPatterns.delete));
  assert.ok(Array.isArray(hapticPatterns.error));

  assert.ok(hapticPatterns.tap > 0);
  assert.ok(hapticPatterns.save.length > 0);
  assert.ok(hapticPatterns.complete.length > 0);
  assert.ok(hapticPatterns.delete.length > 0);
});

test('isHapticsSupported handles missing window safely in Node environment', () => {
  assert.equal(isHapticsSupported(), false);
  assert.equal(triggerHaptic(10), false);
  assert.equal(triggerHaptic('save'), false);
  assert.equal(haptics.tap(), false);
  assert.equal(haptics.pin(), false);
  assert.equal(haptics.save(), false);
  assert.equal(haptics.correct(), false);
  assert.equal(haptics.wrong(), false);
  assert.equal(haptics.streak(), false);
  assert.equal(haptics.complete(), false);
  assert.equal(haptics.delete(), false);
  assert.equal(haptics.sync(), false);
  assert.equal(haptics.error(), false);
});

test('triggerHaptic invokes navigator.vibrate when available', () => {
  let vibratePattern = null;
  const mockNavigator = {
    vibrate: (pattern) => {
      vibratePattern = pattern;
      return true;
    }
  };

  global.window = { navigator: mockNavigator };

  try {
    assert.equal(isHapticsSupported(), true);
    const result = triggerHaptic(15);
    assert.equal(result, true);
    assert.equal(vibratePattern, 15);

    // Named pattern string lookup
    triggerHaptic('save');
    assert.deepEqual(vibratePattern, hapticPatterns.save);

    triggerHaptic('streak');
    assert.deepEqual(vibratePattern, hapticPatterns.streak);

    triggerHaptic('complete');
    assert.deepEqual(vibratePattern, hapticPatterns.complete);

    // Default duration when called with no arguments
    triggerHaptic();
    assert.equal(vibratePattern, 15);

    haptics.pin();
    assert.equal(vibratePattern, hapticPatterns.pin);

    haptics.save();
    assert.deepEqual(vibratePattern, hapticPatterns.save);

    haptics.correct();
    assert.deepEqual(vibratePattern, hapticPatterns.correct);

    haptics.wrong();
    assert.deepEqual(vibratePattern, hapticPatterns.wrong);

    haptics.complete();
    assert.deepEqual(vibratePattern, hapticPatterns.complete);

    haptics.delete();
    assert.deepEqual(vibratePattern, hapticPatterns.delete);
  } finally {
    delete global.window;
  }
});

test('triggerHaptic catches and safely recovers if navigator.vibrate throws', () => {
  const mockNavigator = {
    vibrate: () => {
      throw new Error('User permission denied');
    }
  };

  global.window = { navigator: mockNavigator };

  try {
    assert.equal(isHapticsSupported(), true);
    const result = triggerHaptic(10);
    assert.equal(result, false);
  } finally {
    delete global.window;
  }
});
