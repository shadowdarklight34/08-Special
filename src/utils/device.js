/** Device + preference detection. Read fresh each time so rotations/resizes are respected. */

export const isTouch = () =>
  window.matchMedia('(hover: none) and (pointer: coarse)').matches || navigator.maxTouchPoints > 0;

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

/** 'mobile' | 'tablet' | 'desktop' — used to pick compositions and particle budgets. */
export function deviceTier() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export const isMobile = () => deviceTier() === 'mobile';

export const devicePixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

/** Device orientation is usable without a permission prompt (Android). iOS needs a gesture-gated request; we skip it. */
export const canUseOrientation = () =>
  typeof window.DeviceOrientationEvent !== 'undefined' &&
  typeof window.DeviceOrientationEvent.requestPermission !== 'function' &&
  isTouch();

/** Cheap heuristic so we can shrink particle budgets on weaker hardware. */
export const isLowPower = () =>
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4);
