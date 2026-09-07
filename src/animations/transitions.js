import gsap from 'gsap';

/** Shared entrance/exit helpers. Every scene uses these instead of ad-hoc tweens. */

export const fadeIn = (target, { duration = 0.8, y = 16, delay = 0, ease = 'power2.out' } = {}) =>
  gsap.fromTo(target, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration, delay, ease, overwrite: 'auto' });

export const fadeOut = (target, { duration = 0.5, y = -10, delay = 0, ease = 'power2.in' } = {}) =>
  gsap.to(target, { autoAlpha: 0, y, duration, delay, ease, overwrite: 'auto' });

export const staggerIn = (targets, { duration = 0.7, y = 24, stagger = 0.08, delay = 0, scale = 1, ease = 'power3.out' } = {}) =>
  gsap.fromTo(targets, { autoAlpha: 0, y, scale }, { autoAlpha: 1, y: 0, scale: 1, duration, stagger, delay, ease, overwrite: 'auto' });

/** A white flash overlay — used at the countdown → birthday hand-off. */
export function flash(container, { peak = 0.9, duration = 0.9 } = {}) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute', inset: '0', background: '#fff', opacity: '0',
    pointerEvents: 'none', zIndex: '10',
  });
  container.append(overlay);
  return gsap.timeline({ onComplete: () => overlay.remove() })
    .to(overlay, { opacity: peak, duration: duration * 0.2, ease: 'power4.out' })
    .to(overlay, { opacity: 0, duration: duration * 0.8, ease: 'power2.out' });
}
