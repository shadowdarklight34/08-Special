import gsap from 'gsap';
import { el, asset } from '../utils/dom.js';
import { random, pick, randomSign } from '../utils/random.js';

const RING_COUNT = 16;
const CUT_STYLES = ['cut--white', 'cut--black', 'cut--kraft', 'cut--serif', 'cut--hand', 'cut--orange', 'cut--gold', 'cut--pink'];
const STICKERS = ['flowers.svg', 'stars.svg', 'hearts.svg', 'balloons.svg'];

/**
 * A spiral-bound book. Sheets hang off the spine; each has a front and a back
 * face, so turning a sheet reveals the next spread exactly like paper.
 *
 *   faces = [cover, page…, end]  →  sheet k = (faces[2k] | faces[2k+1])
 *   flipped = number of sheets lying on the left
 */
export class Book {
  constructor({ container, cover = {}, pages = [], photos = [], reducedMotion = false, onOpen, onChange, onEnd }) {
    this.container = container;
    this.cover = cover;
    this.pages = pages;
    this.photos = photos;
    this.reducedMotion = reducedMotion;
    this.onOpen = onOpen;
    this.onChange = onChange;
    this.onEnd = onEnd;
    this.flipped = 0;
    this.turning = false;
    this._cleanups = [];
  }

  get isOpen() { return this.flipped > 0; }
  get isAtEnd() { return this.flipped === this.sheets.length; }

  mount() {
    const faces = [{ type: 'cover' }, ...this.pages.map((p) => ({ type: 'page', ...p })), { type: 'end' }];
    if (faces.length % 2) faces.push({ type: 'blank' });

    this.sheets = [];
    for (let k = 0; k < faces.length / 2; k++) {
      const front = this._face(faces[2 * k], 'front', 2 * k);
      const back = this._face(faces[2 * k + 1], 'back', 2 * k + 1);
      this.sheets.push(el('div', { class: 'sheet', dataset: { index: String(k) } }, [front, back]));
    }
    this.board = el('div', { class: 'book__board', 'aria-hidden': 'true' });
    this.spiral = el('div', { class: 'book__spiral', 'aria-hidden': 'true' },
      Array.from({ length: RING_COUNT }, (_, i) => el('i', { class: 'ring', style: { top: `${((i + 0.5) / RING_COUNT) * 100}%` } })));
    this.book = el('div', { class: 'book', role: 'region', 'aria-roledescription': 'scrapbook', 'aria-label': 'Scrapbook' }, [this.board, ...this.sheets, this.spiral]);
    this.stage = el('div', { class: 'book__stage' }, [this.book]);
    this.container.append(this.stage);

    this._layout();
    this._center(true);
    this._bind();
    return this;
  }

  /* ─── faces ─── */
  _face(face, side, i) {
    const node = el('div', { class: `face face--${side} face--${face.type}`, dataset: { face: String(i) } });
    if (face.type === 'cover') node.append(...this._coverArt());
    else if (face.type === 'page') node.append(...this._pageArt(face, i));
    else if (face.type === 'end') node.append(...this._endArt());
    node.append(el('div', { class: 'face__shade' }));
    return node;
  }

  _coverArt() {
    if (this.cover.image) {
      return [el('img', { class: 'face__img', src: asset(this.cover.image), alt: this.cover.title || 'Diary cover', draggable: 'false' })];
    }
    const name = this.cover.name || 'Zaara';

    // 1. Brass Nameplate / Plaque
    const plaque = el('div', { class: 'diary__plaque' }, [
      el('span', { class: 'diary__rivet diary__rivet--tl', 'aria-hidden': 'true' }),
      el('span', { class: 'diary__rivet diary__rivet--tr', 'aria-hidden': 'true' }),
      el('span', { class: 'diary__rivet diary__rivet--bl', 'aria-hidden': 'true' }),
      el('span', { class: 'diary__rivet diary__rivet--br', 'aria-hidden': 'true' }),
      el('span', { class: 'diary__plaque-kicker', text: 'PERSONAL JOURNAL · 2026' }),
      el('h2', { class: 'diary__plaque-title', text: `${name}'s Diary` }),
      el('span', { class: 'diary__plaque-sub', text: '✦ THE 19TH CHAPTER ✦' }),
    ]);

    // 2. Brass Corner Protectors
    const corners = [
      el('div', { class: 'cover__corner cover__corner--tr', 'aria-hidden': 'true' }),
      el('div', { class: 'cover__corner cover__corner--br', 'aria-hidden': 'true' }),
    ];

    // 3. Elastic Closure Band
    const elasticBand = el('div', { class: 'diary__band', 'aria-hidden': 'true' });

    // 4. Attached Rose-Gold Metallic Pen
    const pen = el('div', { class: 'diary__pen', 'aria-hidden': 'true' }, [
      el('div', { class: 'diary__pen-clip' }),
    ]);

    // 5. Satin Bookmark Ribbon with Star Charm
    const ribbon = el('div', { class: 'cover__ribbon', 'aria-hidden': 'true' }, [
      el('span', { class: 'cover__ribbon-charm', text: '★' }),
    ]);

    // 6. Vintage Diary Postage Stamp
    const stamp = el('div', { class: 'cover__stamp', 'aria-hidden': 'true' }, [
      el('span', { text: 'DIARY ENTRY' }),
      el('strong', { text: '08 SEPT' }),
      el('span', { text: '✦ 19 ✦' }),
    ]);

    // 7. Cover Polaroid Photo with Paperclip
    const snap = el('div', { class: 'diary__cover-snap' }, [
      el('img', { src: asset(this.photos[0]?.src || '/images/photos/photo-01.webp'), alt: '', draggable: 'false' }),
      el('div', { class: 'diary__paperclip', 'aria-hidden': 'true' }),
      el('span', { class: 'diary__snap-caption', text: 'Happy 19th ✨' }),
    ]);

    // 8. Pressed Flower with Tape
    const pressedFlower = el('div', { class: 'diary__pressed-flower', 'aria-hidden': 'true' }, [
      el('img', { src: asset('/images/decorations/flowers.svg'), alt: '' }),
      el('div', { class: 'diary__flower-tape' }),
    ]);

    // 9. Cute Star Accent
    const starAccent = el('img', {
      class: 'diary__star-accent',
      src: asset('/images/decorations/stars.svg'),
      alt: '', 'aria-hidden': 'true',
    });

    return [
      el('div', { class: 'cover__paper cover__paper--leather' }),
      ...corners,
      ribbon,
      pen,
      elasticBand,
      snap,
      pressedFlower,
      plaque,
      stamp,
      starAccent,
    ];
  }

  _pageArt({ image, title, text, tease, mood, quoteTag }, i) {
    const pageNum = i;
    const isLeft = i % 2 === 1;

    // Inside Diary Header (Date, Mood, Entry)
    const header = el('div', { class: 'diary__page-header' }, [
      el('span', { class: 'diary__header-date', text: '📅 Sept 08' }),
      el('span', { class: 'diary__header-mood', text: mood || 'Mood: ✨ 10/10' }),
      el('span', { class: 'diary__header-page', text: `Page ${pageNum}` }),
    ]);

    // Dedicated Mounted Polaroid Photo Section in the open space!
    const photoSrc = image || `/images/photos/photo-0${pageNum + 1}.webp`;
    const photoCardChildren = [
      el('div', { class: 'diary__photo-img-wrap' }, [
        el('img', {
          class: 'diary__photo-img',
          src: asset(photoSrc),
          alt: title || `Memory ${pageNum}`,
          loading: i < 4 ? 'eager' : 'lazy',
          decoding: 'async',
          draggable: 'false',
        }),
      ]),
      el('div', { class: 'diary__photo-caption', text: `✦ Memory 0${pageNum} ✦` }),
    ];
    if (quoteTag) {
      photoCardChildren.push(el('div', { class: 'diary__photo-doodle', text: quoteTag }));
    }

    const photoFrame = el('div', {
      class: `diary__photo-section ${isLeft ? 'diary__photo-section--left' : 'diary__photo-section--right'}`,
    }, [
      el('div', { class: 'diary__photo-tape', 'aria-hidden': 'true' }),
      el('div', { class: 'diary__photo-card' }, photoCardChildren),
    ]);

    const pageNumMarker = el('div', {
      class: `face__page-num ${isLeft ? 'face__page-num--left' : 'face__page-num--right'}`,
      text: `✦ ${pageNum} ✦`,
    });

    const nodes = [header, photoFrame, pageNumMarker];

    if (title || text || tease) {
      const noteChildren = [
        el('div', { class: 'diary__note-paperclip', 'aria-hidden': 'true' }),
        title ? el('h3', { class: 'face__note-title diary__note-title', text: title }) : null,
        text ? el('p', { class: 'face__note-text diary__note-text', text }) : null,
      ];
      if (tease) {
        noteChildren.push(el('div', { class: 'diary__note-tease' }, [
          el('span', { class: 'diary__tease-icon', text: '✎' }),
          el('span', { class: 'diary__tease-text', text: tease }),
        ]));
      }
      nodes.push(el('div', {
        class: `face__note diary__note ${isLeft ? 'face__note--left' : 'face__note--right'}`,
      }, noteChildren));
    }
    return nodes;
  }

  _endArt() {
    return [
      el('div', { class: 'cover__paper cover__paper--light' }),
      el('div', { class: 'diary__end-entry' }, [
        el('div', { class: 'diary__end-kicker', text: '✦ DEAR DIARY · ENTRY CLOSING ✦' }),
        el('div', { class: 'diary__end-divider', 'aria-hidden': 'true' }),
        el('p', { class: 'face__end', text: '…to be continued with many more laughs, smiles & adventures' }),
        el('div', { class: 'face__end-heart', text: '✨', 'aria-hidden': 'true' }),
        el('p', { class: 'diary__end-sign', text: `Happy 19th Birthday ${this.cover.name || 'Zaara'} 🎂` }),
        el('span', { class: 'diary__end-date', text: 'Sept 08, 2026 · (still a menace 😜)' }),
      ]),
    ];
  }

  /* ─── geometry ─── */
  _layout() {
    const S = this.sheets.length;
    this.sheets.forEach((sheet, k) => {
      const done = k < this.flipped;
      sheet.style.zIndex = String(done ? k + 1 : S - k);
      gsap.set(sheet, { rotationY: done ? -180 : 0, z: (done ? k + 1 : S - k) * 0.4 });
    });
  }

  /**
   * Closed at cover: front cover sits on the right half, shift stage left (-clientWidth/4) to center it.
   * Closed at end: final entry sits on the left half. On mobile (< 768px), shift stage right (+clientWidth/4) so the entry is centered and never clipped.
   * Open inside spreads: center the 2-page spread (x = 0).
   */
  _center(instant = false) {
    let x = 0;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (!this.isOpen) {
      x = -this.stage.clientWidth / 4;
    } else if (this.isAtEnd) {
      x = isMobile ? this.stage.clientWidth / 4 : 0;
    } else {
      x = 0;
    }
    if (instant || this.reducedMotion) gsap.set(this.stage, { x });
    else gsap.to(this.stage, { x, duration: 1.1, ease: 'power2.inOut', overwrite: 'auto' });
  }

  /* ─── turning ─── */
  async _turn(direction) {
    if (this.turning) return;
    const k = direction > 0 ? this.flipped : this.flipped - 1;
    if (k < 0 || k >= this.sheets.length) return;
    this.turning = true;

    const sheet = this.sheets[k];
    const wasClosed = !this.isOpen;
    const shades = sheet.querySelectorAll('.face__shade');
    sheet.style.zIndex = String(this.sheets.length * 2 + 5);
    this.flipped += direction;
    this._center();
    if (wasClosed && direction > 0) this.onOpen?.();

    const from = direction > 0 ? 0 : -180;
    const to = direction > 0 ? -180 : 0;
    const proxy = { p: 0 };
    await gsap.to(proxy, {
      p: 1, duration: this.reducedMotion ? 0.35 : 1.15, ease: 'power2.inOut',
      onUpdate: () => {
        gsap.set(sheet, { rotationY: from + (to - from) * proxy.p, z: 2 });
        const s = Math.sin(proxy.p * Math.PI) * 0.45;
        shades.forEach((sh) => { sh.style.opacity = String(s); });
      },
    });
    shades.forEach((sh) => { sh.style.opacity = '0'; });
    this._layout();
    this.turning = false;
    this.onChange?.(this.flipped);
    if (this.isAtEnd) this.onEnd?.();
  }

  next() { return this._turn(1); }
  prev() { return this._turn(-1); }
  open() { return this.isOpen ? Promise.resolve() : this.next(); }

  /* ─── input: tap the right page to go forward, the left page to go back; swipe; arrow keys ─── */
  _bind() {
    let start = null;
    const down = (e) => { start = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    const up = (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y, dt = performance.now() - start.t;
      start = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 800) { dx < 0 ? this.next() : this.prev(); return; }
      if (Math.hypot(dx, dy) > 12) return;
      if (!this.isOpen) { this.next(); return; }
      const spine = this.stage.getBoundingClientRect();
      const mid = spine.left + spine.width / 2;
      e.clientX >= mid ? this.next() : this.prev();
    };
    const key = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
    };
    const resize = () => this._center(true);
    this.book.addEventListener('pointerdown', down);
    this.book.addEventListener('pointerup', up);
    this.book.addEventListener('pointercancel', () => { start = null; });
    window.addEventListener('keydown', key);
    window.addEventListener('resize', resize);
    this.book.style.touchAction = 'pan-y';
    this._cleanups.push(() => {
      this.book.removeEventListener('pointerdown', down);
      this.book.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', key);
      window.removeEventListener('resize', resize);
    });
  }

  destroy() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    gsap.killTweensOf([this.stage, ...this.sheets]);
    this.stage?.remove();
  }
}
