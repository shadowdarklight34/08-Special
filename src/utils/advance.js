/**
 * Lets a scene be advanced like a slideshow: mouse wheel, arrow keys, space/enter,
 * and vertical swipes on touch. Everything is throttled so one flick = one step.
 * Returns a cleanup function.
 */
export function bindAdvance({ onNext, onPrev, target = window, cooldown = 1100, ignore = () => false } = {}) {
  let last = 0;
  const fire = (fn) => {
    const now = performance.now();
    if (now - last < cooldown) return;
    last = now;
    fn?.();
  };

  const onWheel = (e) => {
    if (ignore(e)) return;
    if (Math.abs(e.deltaY) < 24) return;
    fire(e.deltaY > 0 ? onNext : onPrev);
  };
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); fire(onNext); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); fire(onPrev); }
  };

  let touch = null;
  const onTouchStart = (e) => {
    if (ignore(e)) { touch = null; return; }
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, t: performance.now() };
  };
  const onTouchEnd = (e) => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y, dt = performance.now() - touch.t;
    touch = null;
    if (dt > 900) return;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) fire(dy < 0 ? onNext : onPrev);
    else if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.2) fire(dx < 0 ? onNext : onPrev);
  };

  target.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('keydown', onKey);
  target.addEventListener('touchstart', onTouchStart, { passive: true });
  target.addEventListener('touchend', onTouchEnd, { passive: true });
  return () => {
    target.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKey);
    target.removeEventListener('touchstart', onTouchStart);
    target.removeEventListener('touchend', onTouchEnd);
  };
}
