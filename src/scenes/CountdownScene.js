import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { el, measureDigits } from '../utils/dom.js';
import { Odometer } from '../components/Odometer.js';
import { NumberBurn } from '../animations/burn.js';
import { startAgeTicker } from '../utils/age.js';

/**
 * "Counting the years": the number rolls 1 → age−1, lands with a punch, dims and
 * holds while the live age ticker runs, then burns away and the new age rises
 * out of the embers. The birthday scene picks up from that exact frame.
 */
export class CountdownScene extends BaseScene {
  constructor(ctx) { super('countdown', ctx); }

  async build() {
    this.bg = el('div', { class: 'navy-bg' });
    this.odo = new Odometer();
    this.odo.set(1);
    this.onCleanup(() => this.odo.destroy());
    this.canvas = el('canvas', { class: 'countdown__canvas', 'aria-hidden': 'true' });
    this.shockwave = el('div', { class: 'countdown__shockwave', 'aria-hidden': 'true' });
    this.label = el('p', { class: 'kicker countdown__label', text: 'Counting the years' });
    this.ticker = el('p', { class: 'countdown__ticker', 'aria-hidden': 'true' });
    this.flash = el('div', { class: 'flash' });
    this.status = el('p', { class: 'sr-only', 'aria-live': 'polite', text: `Counting the years up to ${this.config.age}` });
    this.root.append(this.bg, this.shockwave, this.odo.root, this.canvas, this.label, this.ticker, this.flash, this.status);
    gsap.set([this.label, this.ticker, this.canvas], { autoAlpha: 0 });
  }

  async animateIn() {
    await gsap.to(this.root, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }

  /** Runs after enter() resolves so the manager is free to accept the next transition. */
  afterEnter() { this.run().catch((err) => console.error('[countdown]', err)); }

  async run() {
    const { age, birthDate } = this.config;
    const reduced = this.reducedMotion;
    const from = Math.max(1, age - 1);

    if (!(await this.wait(350))) return;
    this.track(gsap.to(this.label, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }));

    // 1 → age−1, slow-fast-slow like a reel settling.
    await this.odo.countTo({ from: 1, to: from, duration: reduced ? 0.9 : 3.4, ease: 'power2.inOut' });
    if (!this._active) return;

    // Landing: punch + shockwave + flash, then dim and hold.
    const currentColor = this.odo.currentColor;
    this.track(this.odo.punch());
    if (!reduced) {
      this.shockwave.style.borderColor = currentColor.hex;
      this.shockwave.style.boxShadow = `0 0 50px ${currentColor.glow}, inset 0 0 30px ${currentColor.glow}`;
      this.track(gsap.fromTo(this.shockwave,
        { scale: 0.15, opacity: 1 },
        { scale: 3.2, opacity: 0, duration: 1.15, ease: 'power2.out' }
      ));
      this.track(gsap.fromTo(this.flash, { opacity: 0.85 }, { opacity: 0, duration: 0.9, ease: 'power2.out' }));
    }
    this.track(gsap.to(this.odo.root, { opacity: 0.78, duration: 0.7, delay: 0.5, ease: 'power2.out' }));
    if (birthDate) {
      this.onCleanup(startAgeTicker(this.ticker, birthDate));
      this.track(gsap.to(this.ticker, { autoAlpha: 1, duration: 0.8, delay: 0.6 }));
    }
    if (!(await this.wait(reduced ? 1000 : 2600))) return;

    // The punch has settled back to scale 1.0! Measure exact resting coordinates:
    const fromMeasure = this.odo.measure();
    const fromCols = fromMeasure.cols.filter((c) => c.visible);

    // Measure the target number with the exact typography and spacing of BirthdayScene:
    const targetMeasure = measureDigits(String(age), this.root, 'birthday__number');
    const toCols = targetMeasure.cols;

    // Burn age − 1 → age on the canvas, then hand over to the birthday scene on the same frame.
    const burn = new NumberBurn(this.canvas, { reducedMotion: reduced });
    this.onCleanup(() => burn.destroy());
    gsap.set(this.canvas, { autoAlpha: 1 });
    gsap.set(this.odo.root, { opacity: 0 });
    this.track(gsap.to(this.ticker, { autoAlpha: 0, duration: 0.6, delay: 1.2 }));
    this.track(gsap.to(this.label, { autoAlpha: 0, duration: 0.6, delay: 2.2 }));
    await burn.run({
      fromCols,
      toCols,
      font: targetMeasure.font,
      finalAlpha: 0.95,
      fromHex: fromMeasure.colorHex,
      toHex: '#ffd700',
    });
    if (!this._active) return;

    this.ctx.state.set({ countdownComplete: true });
    this.next();
  }

  /** Hard cut — the birthday scene draws the same number in the same spot. */
  async animateOut() {}
}
