import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { el, asset, wait } from '../utils/dom.js';
import { preloadAll } from '../utils/preload.js';
import { fadeIn } from '../animations/transitions.js';

/**
 * Preloads assets with a radiant ambient glow, then invites the user to tap.
 */
export class LoadingScene extends BaseScene {
  constructor(ctx) { super('loading', ctx); }

  async build() {
    this.bg = el('div', { class: 'navy-bg loading__bg-container' }, [
      el('div', { class: 'loading__aurora-mesh' }),
      el('div', { class: 'loading__orb loading__orb--1' }),
      el('div', { class: 'loading__orb loading__orb--2' }),
      el('div', { class: 'loading__orb loading__orb--3' }),
      el('div', { class: 'loading__sparkles' }, Array.from({ length: 24 }, (_, i) =>
        el('span', {
          class: `loading__sparkle loading__sparkle--${(i % 5) + 1}`,
          style: `left:${(i * 17 + 5) % 94}%; top:${(i * 29 + 8) % 88}%; animation-delay:${(i * 0.35).toFixed(2)}s;`,
        })
      )),
    ]);
    this.auraOuter = el('div', { class: 'loading__aura-outer', 'aria-hidden': 'true' });
    this.aura = el('div', { class: 'loading__aura', 'aria-hidden': 'true' });
    this.kicker = el('p', { class: 'kicker loading__kicker', text: 'a little something for' });
    this.nameEl = el('h1', { class: 'loading__name', text: this.config.name });
    this.fill = el('div', { class: 'loading__bar-fill' });
    this.bar = el('div', { class: 'loading__bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0', 'aria-label': 'Loading progress' }, [this.fill]);
    this.label = el('p', { class: 'loading__label', text: 'loading', 'aria-live': 'polite' });
    this.begin = el('button', { class: 'btn btn--solid loading__begin', type: 'button', text: 'Tap to begin ✨', onClick: () => this.start() });
    this.hint = el('p', { class: 'loading__hint', text: 'best with sound on 🎧' });
    this.begin.style.visibility = 'hidden';
    this.hint.style.visibility = 'hidden';

    this.root.append(
      this.bg,
      this.auraOuter,
      this.aura,
      el('div', { class: 'scene__center' }, [this.kicker, this.nameEl, this.bar, this.label, this.begin, this.hint])
    );
  }

  async animateIn() {
    const tl = this.timeline();
    tl.to(this.root, { opacity: 1, duration: 0.6 }, 0)
      .from([this.auraOuter, this.aura], { opacity: 0, duration: 1.2, ease: 'power2.out' }, 0.1)
      .from(this.kicker, { autoAlpha: 0, y: 10, duration: 0.8 }, 0.2)
      .from(this.nameEl, { autoAlpha: 0, scale: 0.9, y: 16, duration: 0.95, ease: 'back.out(1.5)' }, 0.35)
      .from([this.bar, this.label], { autoAlpha: 0, duration: 0.6 }, 0.7);
    await tl;

    if (!this.state.assetsLoaded) await this.preload();
    else this.setProgress(1);
    await this.showBegin();
  }

  async preload() {
    try {
      const { photos, scrapbook } = this.config;
      const images = [
        ...photos.slice(0, 8).map((p) => asset(p.src)),
        ...scrapbook.pages.slice(0, 2).map((p) => asset(p.image)),
        scrapbook.cover?.image ? asset(scrapbook.cover.image) : null,
        asset('/images/background/paper.svg'),
        asset('/images/decorations/tape.svg'),
      ].filter(Boolean);
      const startedAt = performance.now();
      await preloadAll({
        images,
        audio: null, // Audio starts on user tap ("Tap to begin"); mobile browsers block preloading before user interaction
        onProgress: (p) => this.setProgress(p),
      });
      await wait(Math.max(0, 800 - (performance.now() - startedAt)));
    } catch (err) {
      console.warn('[LoadingScene] preload warning:', err);
    } finally {
      this.setProgress(1);
      this.ctx.state.set({ assetsLoaded: true });
    }
  }

  setProgress(p) {
    const pct = Math.round(p * 100);
    this.fill.style.width = `${pct}%`;
    this.bar.setAttribute('aria-valuenow', String(pct));
  }

  async showBegin() {
    await gsap.to([this.bar, this.label], { autoAlpha: 0, duration: 0.35 });
    this.bar.hidden = true;
    this.label.hidden = true;
    this.track(fadeIn(this.begin, { duration: 0.7 }));
    this.track(fadeIn(this.hint, { duration: 0.7, delay: 0.25 }));
    this.begin.focus({ preventScroll: true });
  }

  start() {
    if (this.begin.disabled) return;
    this.begin.disabled = true;
    this.ctx.audio.play();
    document.getElementById('ui-layer').hidden = false;
    this.manager.goTo('countdown');
  }
}
