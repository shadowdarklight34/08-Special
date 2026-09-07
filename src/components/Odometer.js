import gsap from 'gsap';
import { el } from '../utils/dom.js';
import { clamp } from '../utils/random.js';

export const DIGIT_COLORS = [
  { hex: '#00d2ff', glow: 'rgba(0, 210, 255, 0.85)' },   // 1: Vivid Electric Cyan-Blue
  { hex: '#ff3366', glow: 'rgba(255, 51, 102, 0.85)' },   // 2: Radiant Cherry Rose
  { hex: '#a855f7', glow: 'rgba(168, 85, 247, 0.85)' },  // 3: Royal Purple Amethyst
  { hex: '#ff8c00', glow: 'rgba(255, 140, 0, 0.85)' },   // 4: Warm Mango Orange
  { hex: '#10b981', glow: 'rgba(16, 185, 129, 0.85)' },  // 5: Emerald Mint
  { hex: '#ff1493', glow: 'rgba(255, 20, 147, 0.85)' },  // 6: Deep Hot Pink
  { hex: '#ffd700', glow: 'rgba(255, 215, 0, 0.85)' },   // 7: Brilliant Sun Gold
  { hex: '#00f5d4', glow: 'rgba(0, 245, 212, 0.85)' },   // 8: Neon Aquamarine
  { hex: '#9d4edd', glow: 'rgba(157, 78, 221, 0.85)' },  // 9: Cosmic Violet
  { hex: '#ff5722', glow: 'rgba(255, 87, 34, 0.85)' },   // 10: Flame Coral
  { hex: '#00e5ff', glow: 'rgba(0, 229, 255, 0.85)' },   // 11: Electric Turquoise
  { hex: '#f72585', glow: 'rgba(247, 37, 133, 0.85)' },  // 12: Radiant Magenta
  { hex: '#ff9100', glow: 'rgba(255, 145, 0, 0.85)' },   // 13: Tangerine Sunset
  { hex: '#06d6a0', glow: 'rgba(6, 214, 160, 0.85)' },   // 14: Tropical Mint
  { hex: '#b5179e', glow: 'rgba(181, 23, 158, 0.85)' },  // 15: Deep Orchid
  { hex: '#70e000', glow: 'rgba(112, 224, 0, 0.85)' },   // 16: Neon Spring Lime
  { hex: '#4cc9f0', glow: 'rgba(76, 201, 240, 0.85)' },  // 17: Sky Crystal
  { hex: '#ff2a85', glow: 'rgba(255, 42, 133, 0.95)' },  // 18: Luminous Star Rose Pink
  { hex: '#ffd700', glow: 'rgba(255, 215, 0, 0.95)' },   // 19: Pure Celebration Gold
];

/**
 * A two-column slot-machine number. Each column is a vertical reel of digits
 * that scrolls continuously, so fast counting blurs like a real odometer.
 */
export class Odometer {
  constructor({ className = '' } = {}) {
    this.root = el('div', { class: `bignum odo ${className}`.trim(), 'aria-hidden': 'true' });
    // tens reel: blank, 1–9   ·   ones reel: 0–9 plus a duplicate 0 so 9 → 0 rolls forward
    this.tens = this._column(['', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    this.ones = this._column(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    this.root.append(this.tens.col, this.ones.col);
    gsap.set(this.root, { xPercent: -50, yPercent: -50 });
    this.value = 0;
    this._last = { v: 0, t: 0 };
    this.currentColor = DIGIT_COLORS[0];
    this.set(0);
  }

  _column(digits) {
    const reel = el('div', { class: 'odo__reel' }, digits.map((d) => el('span', { class: 'odo__digit', text: d || ' ' })));
    const col = el('div', { class: 'odo__col' }, [reel]);
    return { col, reel, count: digits.length, pos: 0, setY: gsap.quickSetter(reel, 'yPercent') };
  }

  _place(column, pos) {
    column.pos = pos;
    column.setY(-(pos * 100) / column.count);
  }

  getColor(v) {
    const val = Math.max(1, Math.round(v));
    const idx = (val - 1) % DIGIT_COLORS.length;
    return DIGIT_COLORS[idx];
  }

  set(v) {
    this.value = v;
    const s = Math.max(0, v);
    const ones = s % 10;                              // 0 … 10 (10 = the duplicate 0)
    const tens = Math.floor(s / 10) + clamp(ones - 9, 0, 1);   // rolls during the 9 → 0 wrap
    this._place(this.ones, ones);
    this._place(this.tens, tens);
    // Single digits stay optically centred: fade the tens column and shift the number by half a column.
    const lead = clamp(tens, 0, 1);
    this.tens.col.style.opacity = String(lead);
    const half = this.tens.col.offsetWidth / 2;
    gsap.set(this.root, { x: -(1 - lead) * half });

    // Dynamic number color and glowing halo
    const color = this.getColor(v);
    this.currentColor = color;
    this.root.style.color = color.hex;
    const isMob = window.innerWidth < 768;
    this.root.style.filter = isMob
      ? `drop-shadow(0 0 16px ${color.glow})`
      : `drop-shadow(0 0 20px ${color.glow}) drop-shadow(0 0 50px ${color.glow})`;
  }

  _blur(px) {
    if (window.innerWidth < 768) return; // Skip heavy SVG/CSS raster blur on mobile
    const f = px > 0.3 ? `blur(${px.toFixed(1)}px)` : 'none';
    this.ones.reel.style.filter = f;
    this.tens.reel.style.filter = px > 0.3 && this.tens.pos % 1 !== 0 ? f : 'none';
  }

  countTo({ from = 1, to = 24, duration = 3, ease = 'power2.inOut' } = {}) {
    this.tween?.kill();
    const proxy = { v: from };
    this.set(from);
    this._last = { v: from, t: performance.now() };
    return new Promise((resolve) => {
      this.tween = gsap.to(proxy, {
        v: to, duration, ease,
        onUpdate: () => {
          const now = performance.now();
          const dt = Math.max(1, now - this._last.t) / 1000;
          const speed = Math.abs(proxy.v - this._last.v) / dt;     // units per second
          this._last = { v: proxy.v, t: now };
          this.set(proxy.v);
          this._blur(clamp(speed * 0.4, 0, 9));
        },
        onComplete: () => { this.set(to); this._blur(0); resolve(true); },
        onInterrupt: () => resolve(false),
      });
    });
  }

  punch() {
    return gsap.fromTo(this.root,
      { scale: 1.42, rotation: -2 },
      { scale: 1, rotation: 0, duration: 1.15, ease: 'elastic.out(1.2, 0.45)' }
    );
  }

  /** Per-digit rects and font info so the canvas can draw the exact same glyphs on top. */
  measure() {
    const cs = getComputedStyle(this.root);
    const digitOf = (column) => column.reel.children[Math.round(column.pos) % column.count].textContent.trim();
    const cols = [this.tens, this.ones]
      .map((c) => ({ digit: digitOf(c), rect: c.col.getBoundingClientRect(), visible: Number(c.col.style.opacity || 1) > 0.5 && !!digitOf(c) }));
    return {
      cols,
      font: { family: cs.fontFamily, weight: cs.fontWeight, size: parseFloat(cs.fontSize), letterSpacing: cs.letterSpacing },
      color: cs.color,
      colorHex: this.currentColor?.hex || '#38bdf8',
      colorGlow: this.currentColor?.glow || 'rgba(56, 189, 248, 0.75)',
      opacity: parseFloat(cs.opacity),
    };
  }

  destroy() { this.tween?.kill(); }
}
