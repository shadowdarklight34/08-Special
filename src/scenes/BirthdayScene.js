import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { el } from '../utils/dom.js';
import { createBalloons } from '../animations/balloons.js';
import { ConfettiCannon } from '../animations/confetti.js';
import { random } from '../utils/random.js';

/** "Happy 🎉 Birthday 🎂 🎈" split into puffy letters; emoji stay as emoji. */
const PARTS = [
  { word: 'Happy', emoji: '🎉' },
  { word: 'Birthday', emoji: '🎂' },
  { emoji: '🎈' },
];
const EMOJI_RE = /\p{Extended_Pictographic}/u;

/** Delicious candy pastel palette for each letter */
const CANDY_PALETTE = [
  { c: '#ff5e87', dark: '#d62250', shadow: 'rgba(255, 94, 135, 0.7)' }, // H: Strawberry Pink
  { c: '#ff9234', dark: '#d96500', shadow: 'rgba(255, 146, 52, 0.7)' },  // a: Mango Orange
  { c: '#f7c948', dark: '#c79200', shadow: 'rgba(247, 201, 72, 0.7)' },  // p: Lemon Yellow
  { c: '#20c997', dark: '#099268', shadow: 'rgba(32, 201, 151, 0.7)' },  // p: Mint Green
  { c: '#38bdf8', dark: '#0284c7', shadow: 'rgba(56, 189, 248, 0.7)' },  // y: Sky Blue
  { c: '#a855f7', dark: '#7e22ce', shadow: 'rgba(168, 85, 247, 0.7)' },  // B: Orchid Violet
  { c: '#f43f5e', dark: '#be123c', shadow: 'rgba(244, 63, 94, 0.7)' },   // i: Rose Berry
  { c: '#fb923c', dark: '#c2410c', shadow: 'rgba(251, 146, 60, 0.7)' },  // r: Coral Red
  { c: '#eab308', dark: '#a16207', shadow: 'rgba(234, 179, 8, 0.7)' },   // t: Sunny Gold
  { c: '#10b981', dark: '#047857', shadow: 'rgba(16, 185, 129, 0.7)' },  // h: Emerald
  { c: '#6366f1', dark: '#4338ca', shadow: 'rgba(99, 102, 241, 0.7)' },  // d: Indigo
  { c: '#ec4899', dark: '#be185d', shadow: 'rgba(236, 72, 153, 0.7)' },  // a: Magenta
  { c: '#06b6d4', dark: '#0e7490', shadow: 'rgba(6, 182, 212, 0.7)' },   // y: Cyan
];

export class BirthdayScene extends BaseScene {
  constructor(ctx) { super('birthday', ctx); }

  async build() {
    const { age, name } = this.config;
    this.bg = el('div', { class: 'navy-bg' });
    this.halo = el('div', { class: 'birthday__halo', 'aria-hidden': 'true' });
    
    // Twinkling starlight fairy dust across the sky
    const isMobile = this.tier === 'mobile' || window.innerWidth < 768;
    const starCount = isMobile ? 12 : 24;
    this.stars = el('div', { class: 'birthday__stars', 'aria-hidden': 'true' },
      Array.from({ length: starCount }, () => el('span', {
        class: 'birthday__star',
        style: {
          left: `${random(4, 96)}%`,
          top: `${random(6, 92)}%`,
          width: `${random(2.5, 4.5)}px`,
          height: `${random(2.5, 4.5)}px`,
          animationDelay: `${random(0, 3).toFixed(2)}s`,
          animationDuration: `${random(2.4, 4.2).toFixed(2)}s`,
        },
      }))
    );

    this.number = el('div', { class: 'bignum birthday__number', text: String(age), 'aria-hidden': 'true' });
    this.balloonLayer = el('div', { class: 'birthday__balloons', 'aria-hidden': 'true' });

    let colorIdx = 0;
    this.letters = [];
    this.words = PARTS.map(({ word, emoji }) => {
      const nodes = [];
      if (word) {
        for (const ch of word) {
          const color = CANDY_PALETTE[colorIdx % CANDY_PALETTE.length];
          colorIdx++;
          const letterNode = el('span', {
            class: 'bubble',
            text: ch,
            style: {
              '--letter-c': color.c,
              '--letter-dark': color.dark,
              '--letter-shadow': color.shadow,
            },
          });
          nodes.push(letterNode);
        }
      }
      if (emoji) nodes.push(el('span', { class: 'bubble bubble--emoji', text: emoji }));
      this.letters.push(...nodes);
      return el('span', { class: 'bubble-word' }, nodes);
    });
    this.row = el('div', { class: 'bubble-row', role: 'heading', 'aria-level': '1', 'aria-label': `Happy Birthday ${name}` }, this.words);

    // Heartwarming celebration wish badge for her
    this.wishBadge = el('div', { class: 'birthday__wish-badge', 'aria-hidden': 'true' }, [
      el('span', { class: 'wish-badge__heart', text: '💖' }),
      el('span', { class: 'wish-badge__text', text: `Happy ${age}th Birthday to the most special person! ✨` }),
      el('span', { class: 'wish-badge__heart', text: '🎂' }),
    ]);

    this.root.append(this.bg, this.halo, this.stars, this.number, this.balloonLayer, this.row, this.wishBadge);

    gsap.set(this.number, { xPercent: -50, yPercent: -50, opacity: 0.95 });
    gsap.set(this.row, { yPercent: 0, top: '104%' });
    gsap.set(this.letters, { autoAlpha: 0, scale: 0.6 });
    gsap.set(this.wishBadge, { autoAlpha: 0 });

    // Interactive floating hearts on tap anywhere
    const spawnHearts = (x, y) => {
      const heartIcons = ['💖', '💕', '✨', '🌸', '❤️'];
      const heartCount = isMobile ? 3 : 5;
      for (let i = 0; i < heartCount; i++) {
        const heart = el('span', {
          class: 'birthday__tap-heart',
          text: heartIcons[Math.floor(Math.random() * heartIcons.length)],
          style: {
            left: `${x + random(-15, 15)}px`,
            top: `${y + random(-15, 15)}px`,
            fontSize: `${random(18, 26)}px`,
          },
        });
        this.root.append(heart);
        gsap.to(heart, {
          y: random(-70, -110),
          x: random(-35, 35),
          scale: random(1.15, 1.5),
          opacity: 0,
          duration: random(0.8, 1.2),
          ease: 'power1.out',
          onComplete: () => heart.remove(),
        });
      }
    };

    // A tap anywhere spawns sweet hearts and (after a moment) advances
    this.listen(this.root, 'pointerdown', (e) => {
      spawnHearts(e.clientX, e.clientY);
      if (this._canSkip) this.next();
    });
    this.listen(window, 'keydown', (e) => {
      if (this._canSkip && ['Enter', ' ', 'ArrowRight'].includes(e.key)) this.next();
    });
  }

  /** Hard cut in — the countdown left the same number in the same spot. */
  async animateIn() {
    gsap.set(this.root, { opacity: 1 });
  }

  afterEnter() {
    const reduced = this.reducedMotion;
    const isMobile = this.tier === 'mobile' || window.innerWidth < 768;
    const count = isMobile
      ? (this.config.limits?.balloons?.mobile ?? 10)
      : (this.config.limits?.balloons?.[this.tier] ?? 22);
    this.onCleanup(createBalloons(this.balloonLayer, { count, reducedMotion: reduced, spread: reduced ? 0 : 4.5 }));

    if (!reduced) {
      this.confetti = new ConfettiCannon(this.root);
      this.confetti.startShower({ duration: 5500, rate: isMobile ? 2 : 4 });
      this.onCleanup(() => this.confetti.destroy());
    }

    const tl = this.timeline();
    // The letters float up gracefully with spring bounce and settle right above the number
    tl.to(this.letters, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.03, ease: 'back.out(2)' }, 0.4)
      .to(this.row, { top: reduced ? '18%' : '17%', duration: reduced ? 1.0 : 1.35, ease: 'back.out(1.2)' }, 0.4)
      .fromTo(this.wishBadge, { autoAlpha: 0, y: 22, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }, 1.1)
      .call(() => { this._canSkip = true; }, null, 1.8)
      .call(() => { if (this._active) this.next(); }, null, reduced ? 4.5 : 8.5);

    if (!reduced) {
      if (isMobile) {
        // High-performance single-container float on mobile
        this.track(gsap.to(this.row, {
          y: -7, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.6,
        }));
      } else {
        for (const letter of this.letters) {
          this.track(gsap.to(letter, {
            y: random(-8, 8), rotation: random(-5, 5),
            duration: random(1.6, 2.6), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: random(0, 1.2),
          }));
        }
      }
    }
  }

  /** The next scene slides up over this one, so there's nothing to animate here. */
  async animateOut() {}
}

export { EMOJI_RE };
