import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { el } from '../utils/dom.js';
import { Book } from '../components/Book.js';
import { fadeIn } from '../animations/transitions.js';
import { isTouch } from '../utils/device.js';

export class ScrapbookScene extends BaseScene {
  constructor(ctx) { super('scrapbook', ctx); }

  async build() {
    const { scrapbook, photos } = this.config;
    this.bg = el('div', { class: 'navy-bg' });
    this.glow = el('div', { class: 'scrapbook__ambient-glow', 'aria-hidden': 'true' });
    this.deskGlow = el('div', { class: 'scrapbook__desk-glow', 'aria-hidden': 'true' });

    // Floating fairy lights / warm ambient bokeh
    this.fairyLights = Array.from({ length: 4 }, (_, idx) => {
      return el('div', { class: `scrapbook__light scrapbook__light--${idx + 1}`, 'aria-hidden': 'true' });
    });

    this.layout = el('div', { class: 'scrapbook__layout' });
    
    this.badge = el('div', { class: 'scrapbook__badge' }, [
      el('span', { class: 'scrapbook__badge-star', text: '✦' }),
      el('span', { class: 'scrapbook__badge-text', text: `${this.config.name || 'Zaara'}'s Birthday Diary 📖` }),
      el('span', { class: 'scrapbook__badge-star', text: '✦' }),
    ]);

    this.hint = el('p', { class: 'kicker scrapbook__hint', text: '✨ tap the diary or use arrows to flip pages ✨' });
    this.continueBtn = el('button', { class: 'btn continue-btn scrapbook__continue', type: 'button', text: 'One last thing →', onClick: () => this.next() });
    
    // Side navigation arrow buttons
    this.prevBtn = el('button', {
      class: 'btn btn--icon scrapbook__nav-btn scrapbook__nav-btn--prev',
      type: 'button',
      'aria-label': 'Previous page',
      onClick: () => this.book.prev(),
    }, [el('span', { text: '‹' })]);

    this.nextBtn = el('button', {
      class: 'btn btn--icon scrapbook__nav-btn scrapbook__nav-btn--next scrapbook__nav-btn--pulse',
      type: 'button',
      'aria-label': 'Next page',
      onClick: () => this.book.next(),
    }, [el('span', { text: '›' })]);

    this.root.append(
      this.bg,
      this.glow,
      this.deskGlow,
      ...this.fairyLights,
      this.layout,
      this.badge,
      this.prevBtn,
      this.nextBtn,
      this.hint,
      this.continueBtn
    );

    const updateNavigation = (i) => {
      const isCover = i === 0;
      const isEnd = i >= this.book.sheets.length;

      const textEl = this.badge.querySelector('.scrapbook__badge-text');
      if (textEl) {
        if (i === 0) textEl.textContent = 'Diary Cover · 2026';
        else if (i === 1) textEl.textContent = 'Chapter 01 & 02 · First Impressions';
        else if (i === 2) textEl.textContent = 'Chapter 03 & 04 · Good Times';
        else if (i === 3) textEl.textContent = 'Chapter 05 & 06 · Year 19 ✨';
        else textEl.textContent = 'Dear Diary · To Be Continued ✨';
      }

      // Arrows state
      if (this.prevBtn) {
        gsap.to(this.prevBtn, {
          autoAlpha: isCover ? 0.25 : 1,
          pointerEvents: isCover ? 'none' : 'auto',
          scale: isCover ? 0.88 : 1,
          duration: 0.25,
        });
      }
      if (this.nextBtn) {
        gsap.to(this.nextBtn, {
          autoAlpha: isEnd ? 0.25 : 1,
          pointerEvents: isEnd ? 'none' : 'auto',
          scale: isEnd ? 0.88 : 1,
          duration: 0.25,
        });
        if (isCover) {
          this.nextBtn.classList.add('scrapbook__nav-btn--pulse');
        } else {
          this.nextBtn.classList.remove('scrapbook__nav-btn--pulse');
        }
      }
    };

    this.book = new Book({
      container: this.layout,
      cover: scrapbook.cover,
      pages: scrapbook.pages,
      photos,
      reducedMotion: this.reducedMotion,
      onOpen: () => {
        this.hint.textContent = isTouch() ? 'tap page or swipe to turn' : 'tap page, use arrows, or press ← →';
        this.revealContinue();
      },
      onChange: (i) => {
        this.ctx.state.set({ currentPage: i });
        updateNavigation(i);
      },
      onEnd: () => this.revealContinue(),
    }).mount();

    // Initial arrow states
    updateNavigation(0);

    this.onCleanup(() => this.book.destroy());
    gsap.set([this.badge, this.prevBtn, this.nextBtn, this.hint, this.continueBtn], { autoAlpha: 0 });
  }

  revealContinue() {
    if (this._continueShown) return;
    this._continueShown = true;
    this.continueBtn.classList.add('is-ready');
    this.track(fadeIn(this.continueBtn, { duration: 0.8, delay: 0.4, y: 8 }));
  }

  async animateIn() {
    const reduced = this.reducedMotion;
    const tl = this.timeline();
    tl.to(this.root, { opacity: 1, duration: 0.7 }, 0)
      .fromTo(this.book.book, { autoAlpha: 0, y: 60, rotationX: 18, scale: 0.9, transformOrigin: '50% 100%' },
        { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: reduced ? 0.4 : 1.3, ease: 'power3.out' }, 0.2)
      .to([this.badge, this.prevBtn, this.nextBtn], { autoAlpha: 1, duration: 0.6 }, 0.4)
      .add(fadeIn(this.hint, { duration: 0.6 }), '-=0.5');
    await tl;
  }

  async animateOut() {
    await gsap.to(this.root, { opacity: 0, duration: 0.7, ease: 'power2.inOut' });
  }
}
