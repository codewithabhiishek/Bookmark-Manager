/**
 * Tactile mobile haptic feedback engine for Bookmark-Manager.
 * Safely guards against non-supporting browsers and SSR/Node runtimes.
 */

export const isHapticsSupported = () => {
  return (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    typeof window.navigator.vibrate === 'function'
  );
};

export const hapticPatterns = {
  tap: 8,
  select: 12,
  pin: 15,
  save: [15, 50, 20],
  correct: [15, 50, 20],
  wrong: [20, 40, 20],
  streak: [15, 60, 25],
  complete: [25, 20, 25, 20, 40],
  sync: [20, 40, 20],
  delete: [25, 45, 30],
  error: [35, 50, 35],
};

/**
 * Trigger a haptic pattern. Accepts a named string key, duration number, or vibration array.
 * @param {keyof typeof hapticPatterns | number | number[]} [pattern=15]
 * @returns {boolean}
 */
export const triggerHaptic = (pattern = 15) => {
  if (!isHapticsSupported()) return false;
  try {
    const resolvedPattern =
      typeof pattern === 'string'
        ? hapticPatterns[pattern] || 15
        : pattern;
    return window.navigator.vibrate(resolvedPattern);
  } catch {
    return false;
  }
};

export const haptics = {
  isSupported: isHapticsSupported,
  trigger: triggerHaptic,
  tap: () => triggerHaptic(hapticPatterns.tap),
  select: () => triggerHaptic(hapticPatterns.select),
  pin: () => triggerHaptic(hapticPatterns.pin),
  save: () => triggerHaptic(hapticPatterns.save),
  correct: () => triggerHaptic(hapticPatterns.correct),
  wrong: () => triggerHaptic(hapticPatterns.wrong),
  streak: () => triggerHaptic(hapticPatterns.streak),
  complete: () => triggerHaptic(hapticPatterns.complete),
  sync: () => triggerHaptic(hapticPatterns.sync),
  delete: () => triggerHaptic(hapticPatterns.delete),
  error: () => triggerHaptic(hapticPatterns.error),
};

export default haptics;
