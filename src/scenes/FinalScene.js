import gsap from 'gsap';
import { BaseScene } from './BaseScene.js';
import { el } from '../utils/dom.js';
import { Starfield } from '../animations/particles.js';
import { createFlythrough } from '../animations/flythrough.js';
import { ConfettiCannon } from '../animations/confetti.js';
import { shuffle } from '../utils/random.js';

/**
 * The 3D Memory World & Ending:
 * An interactive 3D universe of memories floating in space with celestial rings,
 * continuous slow auto-orbit, 360° mouse drag / touch orbit, zoom, shooting stars,
 * collapsible final message card, and an interactive Birthday Wish Box.
 */
export class FinalScene extends BaseScene {
  constructor(ctx) { super('final', ctx); }

  async build() {
    const { finalMessage, name } = this.config;
    this.bg = el('div', { class: 'final__bg' });
    this.canvas = el('canvas', { class: 'final__canvas', 'aria-hidden': 'true' });
    this.flyLayer = el('div', { class: 'final__fly' });

    // ─── Pookie Birthday Card Header ───
    this.pookieBadge = el('div', { class: 'final__pookie-badge' }, [
      el('span', { class: 'pookie-bow', text: '🎀', 'aria-hidden': 'true' }),
      el('span', { class: 'pookie-badge-text', text: 'FOR THE BIRTHDAY GIRL' }),
      el('span', { class: 'pookie-sparkle', text: '✨', 'aria-hidden': 'true' }),
    ]);

    this.title = el('h2', { class: 'final__title', text: finalMessage.title });

    this.nameText = el('span', { class: 'final__name', text: name });
    this.nameCharm = el('span', { class: 'final__name-charm', text: '🌸', 'aria-hidden': 'true' });
    this.nameEl = el('div', { class: 'final__name-wrap', role: 'button', tabindex: '0', 'aria-label': 'Tap for sparkles' }, [
      this.nameText,
      this.nameCharm,
    ]);
    this.nameEl.addEventListener('click', (e) => this.popPookieSparkles(e));
    this.nameEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.popPookieSparkles();
      }
    });

    this.pookiePills = el('div', { class: 'final__pookie-pills' }, [
      el('span', { class: 'pookie-pill pookie-pill--pink' }, [el('span', { text: '💖' }), el('span', { text: 'Cutest Human' })]),
      el('span', { class: 'pookie-pill pookie-pill--gold' }, [el('span', { text: '✨' }), el('span', { text: '10/10 Energy' })]),
      el('span', { class: 'pookie-pill pookie-pill--peach' }, [el('span', { text: '🌸' }), el('span', { text: 'Pure Sunshine' })]),
    ]);

    this.lines = finalMessage.lines.map((line) => el('p', { class: 'final__line', text: line }));
    this.signature = el('p', { class: 'final__signature', text: finalMessage.signature });

    // ─── Birthday Wish Box ───
    this.wishBadge = el('span', { class: 'wish-box__badge', text: '✦ SECRET 19TH BIRTHDAY WISH ✦' });
    this.wishTitle = el('h3', { class: 'wish-box__title', text: 'Make a Wish for Year 19 ✨' });

    // Interactive Yes / No Choice Question
    this.wishPrompt = el('p', { class: 'wish-box__prompt', text: 'Will you tell me your birthday wish? 🎂' });

    this.yesBtn = el('button', {
      class: 'btn wish-box__choice-btn wish-box__choice-btn--yes',
      type: 'button',
      text: 'Yes, I will! ✨',
      onClick: () => this.handleChoice('yes'),
    });

    this.noBtn = el('button', {
      class: 'btn wish-box__choice-btn wish-box__choice-btn--no',
      type: 'button',
      text: "No, I won't tell you 😜",
      onClick: () => this.handleChoice('no'),
    });

    this.choiceWrap = el('div', { class: 'wish-box__choices' }, [this.yesBtn, this.noBtn]);

    // Response quote banner (appears when Yes or No is clicked)
    this.wishQuote = el('p', { class: 'wish-box__quote' });
    this.wishSub = el('p', { class: 'wish-box__subtitle' });
    this.responseBanner = el('div', { class: 'wish-box__response-banner' }, [this.wishQuote, this.wishSub]);
    this.responseBanner.style.display = 'none';

    this.wishInput = el('textarea', {
      class: 'wish-box__textarea',
      rows: '2',
      placeholder: 'Type your secret birthday wish here... 🤫✨',
    });
    this.wishError = el('p', { class: 'wish-box__error' });
    this.wishError.style.display = 'none';

    this.wishSubmitBtn = el('button', {
      class: 'btn wish-box__submit-btn',
      type: 'button',
      text: 'Seal & Send My Wish 💌✨',
      onClick: () => this.handleWishSubmit(),
    });

    this.wishPrivacy = el('p', {
      class: 'wish-box__privacy',
      text: '🔒 100% secret · strictly between us ✨',
    });

    this.wishForm = el('div', { class: 'wish-box__form' }, [
      this.wishInput,
      this.wishError,
      this.wishSubmitBtn,
      this.wishPrivacy,
    ]);
    this.wishForm.style.display = 'none';

    // Wish success confirmation view
    this.wishStamp = el('div', { class: 'wish-box__stamp', text: '✦ WISH SEALED IN THE STARS ✦' });
    this.wishSuccessTitle = el('p', { class: 'wish-box__success-title', text: 'Your wish has reached me! 💌✨' });
    this.wishSuccessSub = el('p', {
      class: 'wish-box__success-sub',
      text: "It’s safely noted down and sealed in the universe. Now sit back, smile, and let's see what happens! 😉✨",
    });

    this.wishWaBtn = el('a', {
      class: 'btn wish-box__wa-btn',
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'Share on WhatsApp 💬',
    });

    this.wishCopyBtn = el('button', {
      class: 'btn wish-box__copy-btn',
      type: 'button',
      text: 'Copy My Wish 📋',
      onClick: () => this.copyWish(),
    });

    this.wishToast = el('p', { class: 'wish-box__toast' });
    this.wishToast.style.display = 'none';

    this.wishActions = el('div', { class: 'wish-box__share-actions' }, [this.wishWaBtn, this.wishCopyBtn]);

    this.wishSuccess = el('div', { class: 'wish-box__success' }, [
      this.wishStamp,
      this.wishSuccessTitle,
      this.wishSuccessSub,
      this.wishActions,
      this.wishToast,
    ]);
    this.wishSuccess.style.display = 'none';

    this.wishBox = el('div', { class: 'final__wish-box' }, [
      this.wishBadge,
      this.wishTitle,
      this.wishPrompt,
      this.choiceWrap,
      this.responseBanner,
      this.wishForm,
      this.wishSuccess,
    ]);

    // ─── Actions ───
    this.exploreBtn = el('button', {
      class: 'btn final__toggle-btn',
      type: 'button',
      text: '🌌 Explore 3D Galaxy',
      onClick: (e) => {
        e.stopPropagation();
        this.toggleMinimize(true);
      },
    });

    this.replay = el('button', {
      class: 'btn final__replay',
      type: 'button',
      text: '↻ Replay',
      onClick: () => this.manager.goTo('loading'),
    });

    this.actions = el('div', { class: 'final__actions' }, [this.exploreBtn, this.replay]);

    this.content = el('div', { class: 'final__content' }, [
      this.pookieBadge,
      this.title,
      this.nameEl,
      this.pookiePills,
      el('div', { class: 'final__lines' }, this.lines),
      this.signature,
      this.wishBox,
      this.actions,
    ]);

    // Floating restore button when message is minimized
    this.restoreBtn = el('button', {
      class: 'final__restore-btn',
      type: 'button',
      text: '📜 View Wishes',
      onClick: (e) => {
        e.stopPropagation();
        this.toggleMinimize(false);
      },
    });
    this.restoreBtn.style.display = 'none';

    this.centerWrap = el('div', { class: 'scene__center final__center' }, [this.content]);
    this.root.append(this.bg, this.canvas, this.flyLayer, this.centerWrap, this.restoreBtn);

    // Initial state
    gsap.set([this.title, this.nameEl, ...this.lines, this.signature, this.wishBox, this.actions], { autoAlpha: 0 });
    gsap.set(this.content, { autoAlpha: 0 });

    const count = this.config.limits.stars[this.tier] ?? 240;
    this.stars = new Starfield(this.canvas, { count, reducedMotion: this.reducedMotion });
    this.onCleanup(() => this.stars.stop());

    this.confetti = new ConfettiCannon(this.root);
    this.onCleanup(() => this.confetti.destroy());
  }

  handleChoice(choice) {
    this.yesBtn.classList.toggle('is-selected', choice === 'yes');
    this.noBtn.classList.toggle('is-selected', choice === 'no');

    if (choice === 'no') {
      this.noClicks = (this.noClicks || 0) + 1;
      if (this.noClicks === 1) {
        this.wishQuote.textContent = '“If you don’t tell me your wish, how can I make it come true? 😉”';
        this.wishSub.textContent = "Come on, you can't leave me hanging! Type it below — it stays strictly between us 💫";
      } else if (this.noClicks === 2) {
        this.wishQuote.textContent = '“Still saying no? How am I supposed to be the genie then? 🧞‍♂️✨”';
        this.wishSub.textContent = "Okay fine, keep it secret… but at least type a tiny hint below! 🥺✨";
      } else {
        this.wishQuote.textContent = '“If you don’t tell me your wish, how can I make it come true? 😉”';
        this.wishSub.textContent = "It's 100% safe between us — write whatever you're wishing for ✨";
      }
      gsap.fromTo(this.noBtn, { x: -6 }, { x: 0, duration: 0.35, ease: 'elastic.out(1, 0.3)' });
    } else {
      this.wishQuote.textContent = '“Yay! I knew you would ✨”';
      this.wishSub.textContent = 'Close your eyes, make a wish, and send it into the stars 💫';
      gsap.fromTo(this.yesBtn, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
    }

    if (this.responseBanner.style.display === 'none') {
      this.responseBanner.style.display = 'block';
      gsap.fromTo(this.responseBanner,
        { autoAlpha: 0, y: -8, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }
      );
    } else {
      gsap.fromTo(this.wishQuote,
        { autoAlpha: 0, y: -4 },
        { autoAlpha: 1, y: 0, duration: 0.3 }
      );
    }

    if (this.wishForm.style.display === 'none') {
      this.wishForm.style.display = 'flex';
      gsap.fromTo(this.wishForm,
        { autoAlpha: 0, y: 12, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, delay: 0.08, ease: 'power2.out' }
      );
    }
  }

  handleWishSubmit() {
    const text = this.wishInput.value.trim();
    if (!text) {
      this.wishError.textContent = "Don't skip the best part — make at least one little wish! 🌟";
      this.wishError.style.display = 'block';
      gsap.fromTo(this.wishError, { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3 });
      this.wishInput.focus();
      return;
    }

    this.wishError.style.display = 'none';
    this.currentWishText = text;

    // Save wish locally so it persists
    try {
      localStorage.setItem('birthday_secret_wish', JSON.stringify({
        wish: text,
        timestamp: new Date().toISOString(),
      }));
    } catch (e) {}

    // Automatically send her wish to your email in the background!
    const targetEndpoint = this.config.emailToken || '0d19858ae644b5d66fffe4cb65acb4af';
    try {
      fetch(`https://formsubmit.co/ajax/${targetEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: `${this.config.name}'s Birthday Wish`,
          wish: text,
          time: new Date().toLocaleString(),
          _subject: `🎂 Secret Birthday Wish from ${this.config.name}! ✨`,
          _template: 'table',
          _captcha: 'false',
        }),
      }).catch((err) => console.warn('[Wish Email] Background send note:', err));
    } catch (e) {}

    // Prepare WhatsApp share link
    const encoded = encodeURIComponent(`Hey! Here's my 19th birthday wish: "${text}" ✨`);
    this.wishWaBtn.href = `https://wa.me/?text=${encoded}`;

    // Confetti celebration burst
    const rect = this.wishBox.getBoundingClientRect();
    this.confetti?.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, { count: 55, spread: 320 });

    // Transition form to success
    gsap.to(this.wishForm, {
      autoAlpha: 0,
      scale: 0.92,
      duration: 0.3,
      onComplete: () => {
        this.wishForm.style.display = 'none';
        this.wishSuccess.style.display = 'flex';
        gsap.fromTo(this.wishSuccess,
          { autoAlpha: 0, scale: 0.88, y: 15 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' }
        );
      },
    });
  }

  copyWish() {
    if (!this.currentWishText) return;
    const msg = `My birthday wish: "${this.currentWishText}" ✨`;
    navigator.clipboard?.writeText(msg).then(() => {
      this.wishToast.textContent = 'Wish copied to clipboard! 💖';
      this.wishToast.style.display = 'block';
      gsap.fromTo(this.wishToast, { autoAlpha: 0, y: 5 }, { autoAlpha: 1, y: 0, duration: 0.3 });
      setTimeout(() => {
        gsap.to(this.wishToast, {
          autoAlpha: 0,
          duration: 0.4,
          onComplete: () => { this.wishToast.style.display = 'none'; },
        });
      }, 3000);
    });
  }

  toggleMinimize(minimize) {
    if (minimize) {
      gsap.to(this.content, {
        autoAlpha: 0,
        scale: 0.85,
        y: 28,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => {
          this.content.style.display = 'none';
        },
      });

      this.restoreBtn.style.display = 'inline-flex';
      gsap.fromTo(this.restoreBtn,
        { autoAlpha: 0, y: 16, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, delay: 0.15, ease: 'back.out(1.6)' }
      );
    } else {
      gsap.to(this.restoreBtn, {
        autoAlpha: 0,
        y: 16,
        scale: 0.9,
        duration: 0.25,
        onComplete: () => {
          this.restoreBtn.style.display = 'none';
        },
      });

      this.content.style.display = '';
      gsap.fromTo(this.content,
        { autoAlpha: 0, scale: 0.88, y: 24 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.4)' }
      );
    }
  }

  popPookieSparkles(e) {
    const rect = this.nameEl.getBoundingClientRect();
    const x = e?.clientX || (rect.left + rect.width / 2);
    const y = e?.clientY || (rect.top + rect.height / 2);
    const charms = ['💖', '🌸', '✨', '⭐', '🎀', '💫', '🧁'];
    for (let i = 0; i < 8; i++) {
      const sp = el('span', {
        class: 'final__pookie-sparkle-fly',
        text: charms[i % charms.length],
        style: { left: `${x}px`, top: `${y}px` },
      });
      document.body.append(sp);
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5);
      const dist = 45 + Math.random() * 55;
      gsap.to(sp, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 30,
        scale: 1.4 + Math.random() * 0.4,
        opacity: 0,
        rotation: (Math.random() - 0.5) * 60,
        duration: 0.9 + Math.random() * 0.35,
        ease: 'power2.out',
        onComplete: () => sp.remove(),
      });
    }
    gsap.fromTo(this.nameEl, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
  }

  async animateIn() {
    const reduced = this.reducedMotion;
    const s = reduced ? 0.4 : 1;
    this.stars.start();

    const flying = (this.config.limits.flying[this.tier] ?? 10) + 4;
    this.fly = createFlythrough(this.flyLayer, {
      photos: shuffle(this.config.photos),
      count: flying,
      reducedMotion: reduced,
      speed: this.isMobile ? 180 : 220,
      onPhotoClick: (photo, card) => {
        this.ctx.modal.open({
          src: photo.src,
          alt: photo.alt,
          caption: photo.caption,
          fromEl: card.querySelector('img') || card,
        });
      },
      onCameraMove: (rotX, rotY) => {
        this.stars.setCamera(rotX, rotY);
      },
    });
    this.onCleanup(() => this.fly.destroy());

    const tl = this.timeline();
    tl.to(this.root, { opacity: 1, duration: 1.8 * s, ease: 'power1.inOut' }, 0)
      .to(this.content, { autoAlpha: 1, duration: 1.2 * s }, 4.8 * s)
      .fromTo(this.pookieBadge, { y: 14, autoAlpha: 0 }, { autoAlpha: 1, y: 0, duration: 1.0 * s, ease: 'back.out(1.5)' }, 4.9 * s)
      .fromTo(this.title, { y: 16 }, { autoAlpha: 1, y: 0, duration: 1.2 * s, ease: 'power2.out' }, 5.1 * s)
      .fromTo(this.nameEl, { y: 14, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2 * s, ease: 'back.out(1.6)' }, 5.5 * s)
      .fromTo(this.pookiePills, { y: 10, autoAlpha: 0 }, { autoAlpha: 1, y: 0, duration: 0.9 * s, ease: 'power2.out' }, 5.9 * s)
      .fromTo(this.lines, { y: 10 }, { autoAlpha: 1, y: 0, duration: 1.0 * s, stagger: 0.5 * s, ease: 'power2.out' }, 6.3 * s)
      .fromTo(this.signature, { y: 8 }, { autoAlpha: 1, y: 0, duration: 1.0 * s }, '-=0.2')
      .fromTo(this.wishBox, { y: 12, autoAlpha: 0 }, { autoAlpha: 1, y: 0, duration: 1.1 * s, ease: 'back.out(1.4)' }, '+=0.1')
      .fromTo(this.actions, { y: 8, autoAlpha: 0 }, { autoAlpha: 1, y: 0, duration: 0.8 * s }, '+=0.2');

    await tl;
  }

  async animateOut() {
    await gsap.to(this.root, { opacity: 0, duration: 1.0, ease: 'power2.inOut' });
  }
}
