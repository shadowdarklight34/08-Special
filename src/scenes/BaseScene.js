import gsap from 'gsap';

/**
 * Every scene extends this. It gives each scene:
 *   - a root element (<section id="scene-name">)
 *   - enter()/exit() with fade transitions
 *   - a cleanup registry so timelines, listeners and rAF loops die with the scene
 *
 * Subclasses may set:
 *   theme      'dark' | 'light'  — the global UI (music button, dots) adapts its colours
 *   slideOver  true               — the scene enters on top of the previous one instead of after it
 */
export class BaseScene {
  constructor(name, ctx) {
    this.name = name;
    this.ctx = ctx;               // { state, audio, config, modal }
    this.root = document.getElementById(`scene-${name}`);
    this.manager = null;
    this.theme = 'dark';
    this.slideOver = false;
    this._cleanups = [];
    this._active = false;
  }

  /* ─── helpers ─── */
  get state() { return this.ctx.state.get(); }
  get config() { return this.ctx.config; }
  get reducedMotion() { return this.state.reducedMotion; }
  get tier() { return this.state.tier; }
  get isMobile() { return this.state.tier === 'mobile'; }

  onCleanup(fn) { this._cleanups.push(fn); return fn; }

  listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return this.onCleanup(() => target.removeEventListener(type, handler, options));
  }

  track(tweenOrTimeline) {
    this.onCleanup(() => tweenOrTimeline.kill());
    return tweenOrTimeline;
  }

  timeline(vars = {}) { return this.track(gsap.timeline(vars)); }

  /** Resolves after ms, or immediately (false) if the scene was left in the meantime. */
  wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(() => resolve(this._active), ms);
      this.onCleanup(() => { clearTimeout(id); resolve(false); });
    });
  }

  /* ─── lifecycle ─── */
  async enter() {
    this._active = true;
    this.root.innerHTML = '';
    gsap.set(this.root, { clearProps: 'all' });
    gsap.set(this.root, { opacity: 0 });
    this.root.classList.add('is-active', 'is-entering');
    await this.build();
    await this.animateIn();
    this.root.classList.remove('is-entering');
    // Runs after enter() resolves so a scene that auto-advances never hits a busy manager.
    setTimeout(() => { if (this._active) this.afterEnter(); }, 0);
  }

  /** Optional hook: kicks off self-driven behaviour once the scene is fully in. */
  afterEnter() {}

  /** Stops self-driven behaviour without tearing the DOM down (used when the next scene slides over). */
  deactivate() { this._active = false; }

  async exit({ instant = false } = {}) {
    this._active = false;
    if (!instant) await this.animateOut();
    this.root.classList.remove('is-active', 'is-entering');
    this.destroy();
    this.root.innerHTML = '';
    gsap.set(this.root, { clearProps: 'all' });
  }

  /** Create DOM, wire listeners. Override. */
  async build() {}

  /** Default entrance: soft fade. Override for choreographed timelines. */
  async animateIn() {
    await gsap.to(this.root, { opacity: 1, duration: 0.7, ease: 'power2.out' });
  }

  async animateOut() {
    await gsap.to(this.root, { opacity: 0, duration: 0.5, ease: 'power2.in' });
  }

  destroy() {
    while (this._cleanups.length) {
      const fn = this._cleanups.pop();
      try { fn(); } catch (err) { console.warn(`[${this.name}] cleanup failed`, err); }
    }
    gsap.killTweensOf(this.root);
  }

  /** Convenience: continue to the next scene in order. */
  next() { return this.manager?.next(); }
  prev() { return this.manager?.prev(); }
}
