import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { el } from '../utils/dom.js';
import { createPhotoTrail } from '../animations/photoTrail.js';
import { HeroParticles } from '../animations/heroParticles.js';
import { ConfettiCannon } from '../animations/confetti.js';
import { bindAdvance } from '../utils/advance.js';

/**
 * The title page & centerpiece.
 * Features:
 * - Warm cream paper with ambient drifting golden stardust & interactive mouse sparkles
 * - Chic celebration badge with the date
 * - Editorial typography with radiant metallic golden shimmer on the name & crown
 * - Interactive photo trail with hover slowdown, 3D lift, captions, and full-screen modal zoom
 * - Confetti surprise on clicking the name/crown
 * - Polished Continue button with pulsing glow
 */
export class HeroScene extends BaseScene {
  constructor(ctx) {
    super('hero', ctx);
    this.theme = 'light';
    this.slideOver = true;
  }

  async build() {
    const { name, dateLabel, tagline } = this.config;

    this.bg = el('div', { class: 'cream-bg' });
    this.canvas = el('canvas', { class: 'hero__particles-canvas', 'aria-hidden': 'true' });
    this.trailWrap = el('div', { class: 'hero__trail' });

    // Chic celebration date badge
    this.badge = el('div', { class: 'hero__badge' }, [
      el('span', { class: 'hero__badge-icon', 'aria-hidden': 'true', text: '✦' }),
      el('span', { text: dateLabel }),
      el('span', { class: 'hero__badge-dot', 'aria-hidden': 'true', text: '·' }),
      el('span', { text: 'To Someone Very Special' }),
      el('span', { class: 'hero__badge-icon', 'aria-hidden': 'true', text: '✦' }),
    ]);

    // Title elements
    this.happy = el('span', { class: 'hero__happy', text: 'Happy' });
    this.bday = el('span', { class: 'hero__bday', text: 'Birthday' });
    this.nameText = el('span', { class: 'hero__name', text: name });
    
    // Radiant vector crown
    this.crown = el('span', { class: 'hero__crown', 'aria-hidden': 'true' });
    this.crown.innerHTML = `
      <svg class="hero__crown-svg" viewBox="0 0 44 32" fill="none">
        <defs>
          <linearGradient id="crown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff4cc" />
            <stop offset="40%" stop-color="#f59e0b" />
            <stop offset="70%" stop-color="#ffd700" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>
        <path d="M 4,28 L 7,12 L 16,21 L 22,5 L 28,21 L 37,12 L 40,28 Z" fill="url(#crown-grad)" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="5" y="28" width="34" height="3.2" rx="1.6" fill="url(#crown-grad)" stroke="#b45309" stroke-width="0.8" />
        <circle cx="22" cy="5" r="2.4" fill="#ffffff" stroke="#f59e0b" stroke-width="0.8" />
        <circle cx="7" cy="12" r="1.8" fill="#ff70a6" stroke="#b45309" stroke-width="0.6" />
        <circle cx="37" cy="12" r="1.8" fill="#70d6ff" stroke="#b45309" stroke-width="0.6" />
        <circle cx="15" cy="29.6" r="1.2" fill="#ffffff" />
        <circle cx="22" cy="29.6" r="1.4" fill="#ffd166" />
        <circle cx="29" cy="29.6" r="1.2" fill="#ffffff" />
      </svg>
    `;
    this.nameWrap = el('span', { class: 'hero__name-wrap' }, [this.nameText, this.crown]);
    this.title = el('h1', { class: 'hero__title' }, [this.happy, this.bday, this.nameWrap]);

    // Decorative star divider
    this.ruleLineLeft = el('span', { class: 'hero__rule-line' });
    this.ruleStar = el('span', { class: 'hero__rule-star', 'aria-hidden': 'true', text: '✦' });
    this.ruleLineRight = el('span', { class: 'hero__rule-line hero__rule-line--right' });
    this.ruleWrap = el('div', { class: 'hero__rule-wrap', 'aria-hidden': 'true' }, [
      this.ruleLineLeft,
      this.ruleStar,
      this.ruleLineRight,
    ]);

    // Tagline & subtle hint
    const crushTagline = tagline || 'To the one who effortlessly brightens every room. May your year be as wonderful and bright as your smile ✨';
    this.tagline = el('p', { class: 'hero__tagline', text: crushTagline });
    this.hint = el('div', { class: 'hero__hint' }, [
      el('span', { class: 'hero__hint-icon', text: '✨' }),
      el('span', { text: 'Hover or tap any photo to view memories' }),
    ]);

    this.copy = el('div', { class: 'hero__copy' }, [
      this.badge,
      this.title,
      this.ruleWrap,
      this.tagline,
      this.hint,
    ]);

    // Continue button
    this.btnText = el('span', { text: 'Continue' });
    this.btnArrow = el('span', { class: 'continue-btn__arrow', 'aria-hidden': 'true', text: '→' });
    this.button = el('button', {
      class: 'btn continue-btn hero__continue-btn',
      type: 'button',
      onClick: () => this.next(),
    }, [this.btnText, this.btnArrow]);

    this.root.append(this.bg, this.canvas, this.trailWrap, this.copy, this.button);

    // Initial hidden state for animation
    gsap.set([
      this.badge,
      this.happy,
      this.bday,
      this.nameWrap,
      this.ruleLineLeft,
      this.ruleStar,
      this.ruleLineRight,
      this.tagline,
      this.hint,
      this.button,
      this.crown,
    ], { autoAlpha: 0 });
    gsap.set(this.crown, { scale: 0 });

    // Interactive confetti cannon for celebrations
    this.confetti = new ConfettiCannon(this.root);
    this.onCleanup(() => this.confetti.destroy());

    // Playful compliments on click
    const COMPLIMENTS = [
      'Effortlessly cool, always ✨',
      'Certified birthday star! 🌟',
      'The brightest energy in the room 💫',
      'Keep shining your light 🌸',
      'Hope today is as awesome as you are! 👑',
    ];
    let complimentIdx = 0;

    // Click on name/crown launches celebratory confetti + playful compliment toast
    const onCelebrationClick = (e) => {
      const rect = this.nameWrap.getBoundingClientRect();
      const x = e?.clientX || (rect.left + rect.width / 2);
      const y = e?.clientY || (rect.top + rect.height / 2);
      this.confetti.burst(x, y, { count: 48, spread: 300 });

      const text = COMPLIMENTS[complimentIdx % COMPLIMENTS.length];
      complimentIdx++;
      const toast = el('div', {
        class: 'hero__compliment-toast',
        text,
        style: {
          left: `${x}px`,
          top: `${y - 15}px`,
        },
      });
      this.root.append(toast);
      gsap.fromTo(toast,
        { scale: 0.7, autoAlpha: 0, y: 0 },
        {
          scale: 1, autoAlpha: 1, y: -42, duration: 0.45, ease: 'back.out(2)',
          onComplete: () => {
            gsap.to(toast, {
              autoAlpha: 0, y: -65, duration: 0.35, delay: 1.5, ease: 'power2.in',
              onComplete: () => toast.remove(),
            });
          },
        }
      );
    };
    this.listen(this.nameWrap, 'click', onCelebrationClick);

    // Ambient stardust + cursor sparkles
    this.particles = new HeroParticles(this.canvas, { reducedMotion: this.reducedMotion });
    this.onCleanup(() => this.particles.stop());

    // Advance listener (ignores interactive photo tiles, modal, and buttons)
    this.onCleanup(bindAdvance({
      onNext: () => this.next(),
      ignore: (e) => Boolean(
        e.target.closest('button, .trail__tile, .photo-modal, .hero__name-wrap, a')
      ),
    }));
  }

  async animateIn() {
    const reduced = this.reducedMotion;

    // Smooth curtain rise
    gsap.set(this.root, { opacity: 1, yPercent: 100 });
    await gsap.to(this.root, {
      yPercent: 0,
      duration: reduced ? 0.5 : 1.15,
      ease: 'power3.inOut',
    });
    gsap.set(this.root, { clearProps: 'transform' });

    // Start particles
    this.particles.start();

    // Create interactive photo trail
    const count = this.config.limits.trail[this.tier] ?? 24;
    this.trail = createPhotoTrail(this.trailWrap, {
      photos: this.config.photos,
      count,
      reducedMotion: reduced,
      lapSeconds: this.isMobile ? 26 : 32,
      onPhotoClick: (photo, tile) => {
        this.ctx.modal.open({
          src: photo.src,
          alt: photo.alt,
          caption: photo.caption,
          fromEl: tile.querySelector('img') || tile,
        });
      },
    });
    this.onCleanup(() => this.trail.destroy());

    // Choreographed entrance timeline
    const tl = this.timeline();

    tl.fromTo(this.badge,
      { y: -16, autoAlpha: 0 },
      { autoAlpha: 1, y: 0, duration: 0.75, ease: 'back.out(1.5)' },
      0.1
    )
    .fromTo([this.happy, this.bday],
      { y: 28, autoAlpha: 0 },
      { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.12, ease: 'power3.out' },
      0.2
    )
    .fromTo(this.nameWrap,
      { scale: 0.82, autoAlpha: 0 },
      { autoAlpha: 1, scale: 1, duration: 0.95, ease: 'back.out(1.8)' },
      0.38
    )
    .fromTo(this.crown,
      { scale: 0, rotation: -35, autoAlpha: 0 },
      { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.75, ease: 'elastic.out(1.1, 0.5)' },
      0.65
    )
    .fromTo([this.ruleLineLeft, this.ruleLineRight],
      { scaleX: 0, transformOrigin: 'left center' },
      { autoAlpha: 1, scaleX: 1, duration: 0.7, ease: 'power2.out' },
      0.7
    )
    .fromTo(this.ruleStar,
      { scale: 0, rotation: 180, autoAlpha: 0 },
      { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' },
      0.75
    )
    .fromTo(this.tagline,
      { y: 12, autoAlpha: 0 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      0.85
    )
    .fromTo(this.hint,
      { y: 8, autoAlpha: 0 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' },
      1.1
    )
    .fromTo(this.button,
      { scale: 0.9, autoAlpha: 0 },
      { autoAlpha: 1, scale: 1, duration: 0.65, ease: 'back.out(1.5)' },
      1.25
    );

    await tl;
  }

  async animateOut() {
    await gsap.to(this.root, { opacity: 0, duration: 0.6, ease: 'power2.inOut' });
  }
}
