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

export const triggerHaptic = (pattern) => {
  if (!isHapticsSupported()) return false;
  try {
    return window.navigator.vibrate(pattern);
  } catch {
    return false;
  }
};

export const hapticPatterns = {
  tap: 8,
  select: 12,
  pin: 15,
  save: [15, 50, 20],
  sync: [20, 40, 20],
  delete: [25, 45, 30],
  error: [35, 50, 35],
};

export const haptics = {
  isSupported: isHapticsSupported,
  trigger: triggerHaptic,
  tap: () => triggerHaptic(hapticPatterns.tap),
  select: () => triggerHaptic(hapticPatterns.select),
  pin: () => triggerHaptic(hapticPatterns.pin),
  save: () => triggerHaptic(hapticPatterns.save),
  sync: () => triggerHaptic(hapticPatterns.sync),
  delete: () => triggerHaptic(hapticPatterns.delete),
  error: () => triggerHaptic(hapticPatterns.error),
};

export default haptics;
