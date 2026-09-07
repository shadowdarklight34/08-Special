import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { el } from '../utils/dom.js';
import { createPolaroid, mountPinDefs } from '../components/Polaroid.js';
import { random } from '../utils/random.js';
import { bindAdvance } from '../utils/advance.js';

/** Where the polaroids land (x/y in % of the viewport, r = tilt). Organic non-overlapping placement. */
const LAYOUTS = {
  desktop: [
    { x: 13, y: 30, r: -5 },
    { x: 31, y: 26, r: 4 },
    { x: 50, y: 30, r: -2 },
    { x: 69, y: 25, r: 4 },
    { x: 87, y: 30, r: -4 },
    { x: 21, y: 73, r: 5 },
    { x: 40, y: 75, r: -4 },
    { x: 59, y: 72, r: 4 },
    { x: 77, y: 74, r: -4 },
  ],
  tablet: [
    { x: 20, y: 28, r: -5 },
    { x: 50, y: 25, r: 4 },
    { x: 80, y: 28, r: -4 },
    { x: 26, y: 68, r: 4 },
    { x: 53, y: 70, r: -4 },
    { x: 74, y: 66, r: 3 },
  ],
  mobile: [
    { x: 28, y: 27, r: -4 },
    { x: 74, y: 29, r: 4 },
    { x: 26, y: 50, r: 3 },
    { x: 74, y: 52, r: -3 },
    { x: 50, y: 73, r: -2 },
  ],
};

/** The polaroid wall. Every card can be dragged anywhere; a tap opens it big. */
export class MemoryScene extends BaseScene {
  constructor(ctx) {
    super('memory', ctx);
    this.theme = 'light';
  }

  async build() {
    mountPinDefs();
    this.bg = el('div', { class: 'cream-bg' });
    this.field = el('div', { class: 'memory__field' });

    // Header with aesthetic badge & hint
    this.badge = el('div', { class: 'memory__badge' }, [
      el('span', { class: 'memory__badge-star', 'aria-hidden': 'true', text: '✦' }),
      el('span', { text: 'A Few of My Favorite Vibes' }),
      el('span', { class: 'memory__badge-star', 'aria-hidden': 'true', text: '✦' }),
    ]);
    this.kicker = el('p', { class: 'kicker memory__kicker', text: 'drag them around · tap to view close-up' });
    this.header = el('div', { class: 'memory__header' }, [this.badge, this.kicker]);

    // Playful Shuffle Board Button
    this.shuffleBtn = el('button', {
      class: 'btn memory__shuffle-btn',
      type: 'button',
      'aria-label': 'Shuffle polaroid board',
      onClick: () => this.shuffleBoard(),
    }, [
      el('span', { text: 'Shuffle 🎲' }),
    ]);

    // Aesthetic scrapbook stickers on the wall
    this.stickers = [
      el('span', { class: 'memory__sticker memory__sticker--gold', text: '★ 10/10 VIBES' }),
      el('span', { class: 'memory__sticker memory__sticker--pink', text: 'CERTIFIED ICON 👑' }),
      el('span', { class: 'memory__sticker memory__sticker--star', text: 'ALWAYS SHINING ✨' }),
      el('span', { class: 'memory__sticker memory__sticker--peach', text: 'SUNSHINE ENERGY ☀️' }),
      el('span', { class: 'memory__sticker memory__sticker--mint', text: 'EFFORTLESSLY COOL 💫' }),
    ];

    const layout = LAYOUTS[this.tier] || LAYOUTS.desktop;
    const limit = Math.min(this.config.limits.polaroids[this.tier] ?? layout.length, layout.length);
    this.cards = this.config.photos.slice(0, limit).map((photo, i) => {
      const spot = layout[i];
      const card = createPolaroid(photo, { rotation: spot.r, eager: true, pinIndex: i });
      card.style.setProperty('--x', `${spot.x}%`);
      card.style.setProperty('--y', `${spot.y}%`);
      this.field.append(card);
      return card;
    });

    this.button = el('button', { class: 'btn continue-btn', type: 'button', text: 'Open the diary 📖 →', onClick: () => this.next() });
    this.root.append(this.bg, this.field, ...this.stickers, this.header, this.shuffleBtn, this.button);

    gsap.set(this.cards, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.5 });
    gsap.set([this.header, this.shuffleBtn, ...this.stickers, this.button], { autoAlpha: 0 });
    this.cards.forEach((c) => gsap.set(c, { rotation: Number(c.dataset.rot) + random(-25, 25) }));

    this._bindDrag();
    this.onCleanup(bindAdvance({
      onNext: () => this.next(), onPrev: () => this.prev(),
      ignore: (e) => !!e.target.closest('.polaroid, button'),
    }));
    this.onCleanup(() => this.ctx.modal.close());
  }

  _bindDrag() {
    let z = 10;
    const reduced = this.reducedMotion;
    for (const card of this.cards) {
      const rot = Number(card.dataset.rot);
      const pos = { x: 0, y: 0 };
      const setX = gsap.quickSetter(card, 'x', 'px');
      const setY = gsap.quickSetter(card, 'y', 'px');
      let start = null, origin = null, moved = false;

      const down = (e) => {
        if (e.button != null && e.button !== 0) return;
        start = { x: e.clientX, y: e.clientY };
        origin = { ...pos };
        moved = false;
        card.style.zIndex = String(++z);
        card.setPointerCapture?.(e.pointerId);
      };
      const move = (e) => {
        if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!moved && Math.hypot(dx, dy) > 5) {
          moved = true;
          card.classList.add('is-dragging');
          if (!reduced) gsap.to(card, { rotation: rot * 0.35, scale: 1.06, duration: 0.25, overwrite: 'auto' });
        }
        if (moved) { pos.x = origin.x + dx; pos.y = origin.y + dy; setX(pos.x); setY(pos.y); }
      };
      const up = (e) => {
        if (!start) return;
        card.releasePointerCapture?.(e.pointerId);
        if (moved) {
          gsap.to(card, { rotation: rot, scale: 1, duration: 0.45, ease: 'back.out(2)', overwrite: 'auto' });
          this.spawnSparkles(e.clientX, e.clientY);
        } else {
          this.open(card);
        }
        card.classList.remove('is-dragging');
        start = null;
      };
      this.listen(card, 'pointerdown', down);
      this.listen(card, 'pointermove', move);
      this.listen(card, 'pointerup', up);
      this.listen(card, 'pointercancel', up);
      this.listen(card, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(card); } });
    }
  }

  shuffleBoard() {
    for (const card of this.cards) {
      const origRot = Number(card.dataset.rot);
      gsap.to(card, {
        x: random(-35, 35),
        y: random(-28, 28),
        rotation: origRot + random(-14, 14),
        duration: 0.65,
        ease: 'back.out(1.8)',
      });
    }
  }

  spawnSparkles(x, y) {
    const icons = ['✨', '✦', '⭐', '💫', '🌸'];
    for (let i = 0; i < 3; i++) {
      const sp = el('span', {
        class: 'memory__drop-sparkle',
        text: icons[Math.floor(Math.random() * icons.length)],
        style: {
          left: `${x + random(-14, 14)}px`,
          top: `${y + random(-14, 14)}px`,
        },
      });
      this.root.append(sp);
      gsap.to(sp, {
        y: random(-35, -60),
        x: random(-25, 25),
        scale: random(1.1, 1.4),
        opacity: 0,
        duration: 0.8,
        ease: 'power1.out',
        onComplete: () => sp.remove(),
      });
    }
  }

  open(card) {
    const { src, alt, caption } = card.dataset;
    this.ctx.modal.open({ src, alt, caption, fromEl: card.querySelector('.polaroid__image') });
  }

  async animateIn() {
    const reduced = this.reducedMotion;
    const tl = this.timeline();
    tl.to(this.root, { opacity: 1, duration: 0.6 }, 0)
      .to(this.cards, {
        autoAlpha: 1, scale: 1, rotation: (i) => Number(this.cards[i].dataset.rot),
        duration: reduced ? 0.4 : 0.9, ease: reduced ? 'power2.out' : 'back.out(1.5)',
        stagger: { each: 0.08, from: 'random' },
      }, 0.25)
      .to([this.header, this.shuffleBtn, ...this.stickers, this.button], { autoAlpha: 1, duration: 0.6 }, '-=0.3');
    await tl;
  }

  async animateOut() {
    await gsap.to(this.root, { opacity: 0, duration: 0.55, ease: 'power2.inOut' });
  }
}
