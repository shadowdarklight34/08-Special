import { random, clamp, lerp } from '../utils/random.js';
import { devicePixelRatio } from '../utils/device.js';

/**
 * The hand-off between two numbers: the old one catches fire from the bottom,
 * crumbles into embers, the embers drift, and the new number is pulled together
 * out of a glowing core. Everything happens on one canvas laid over the scene.
 *
 *   burn.run({ fromCols, toCols, font, finalAlpha }) → Promise (resolves when the new number is solid)
 *
 * `cols` come from Odometer.measure(): [{ digit, rect }] in viewport px.
 */
const FIRE = [
  [255, 255, 220], // bright white-gold core
  [255, 215,  60], // golden flame
  [255, 130,  30], // vivid orange
  [244,  63,  94], // radiant rose neon
  [168,  85, 247], // cosmic violet ember
];
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInQuad = (t) => t * t;
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${clamp(a, 0, 1).toFixed(3)})`;
const fireAt = (t) => { // t: 0 (just lit) → 1 (charred)
  const i = clamp(t, 0, 0.999) * (FIRE.length - 1);
  const k = Math.floor(i);
  return mix(FIRE[k], FIRE[Math.min(FIRE.length - 1, k + 1)], i - k);
};

export function parseColor(c) {
  if (Array.isArray(c)) return c;
  if (typeof c === 'string' && c.startsWith('#')) {
    const hex = c.replace('#', '');
    if (hex.length === 3) return hex.split('').map((x) => parseInt(x + x, 16));
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  if (typeof c === 'string' && c.startsWith('rgb')) {
    const m = c.match(/\d+/g);
    if (m) return m.slice(0, 3).map(Number);
  }
  return [255, 255, 255];
}

export class NumberBurn {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduced = reducedMotion;
    this.raf = null;
    this.resize();
  }

  resize() {
    const dpr = devicePixelRatio();
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Rasterise the digits (at device resolution) and sample them into a grid of cells (x, y in CSS px). */
  sample(cols, font, color = [255, 255, 255]) {
    const rgb = parseColor(color);
    const dpr = devicePixelRatio();
    const off = document.createElement('canvas');
    off.width = Math.round(this.w * dpr); off.height = Math.round(this.h * dpr);
    const c = off.getContext('2d', { willReadFrequently: true });
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.font = `${font.weight} ${font.size}px ${font.family}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = rgba(rgb, 1);
    const base = this.canvas.getBoundingClientRect();
    for (const { digit, rect } of cols) {
      const m = c.measureText(digit);
      const cx = rect.left + rect.width / 2 - base.left;
      const cy = rect.top + rect.height / 2 - base.top;
      const yOff = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      const baselineY = cy + yOff;
      c.fillText(digit, cx, baselineY);

      // In Inter with tabular-nums, '1' has a compact foot serif matching Image 1:
      if (digit === '1') {
        const fs = font.size;
        const serifH = fs * 0.092;
        const stemThickness = fs * 0.125;
        const stemRight = cx + (m.actualBoundingBoxRight || stemThickness);
        const stemLeft = stemRight - stemThickness;
        const serifLeft = stemLeft - fs * 0.10;
        const serifRight = stemRight + fs * 0.05;
        const serifW = serifRight - serifLeft;
        c.fillRect(serifLeft, baselineY - serifH, serifW, serifH);
      }
    }
    // Adaptive particle grid: highly optimized for mobile GPUs while remaining silky-smooth
    const isMob = window.innerWidth < 768;
    const step = this.step = isMob
      ? clamp(Math.round(font.size / 34), 6, 9)
      : clamp(Math.round(font.size / 48), 4, 7);
    const { data } = c.getImageData(0, 0, off.width, off.height);
    const cells = [];
    for (let y = Math.floor(step / 2); y < this.h; y += step) {
      for (let x = Math.floor(step / 2); x < this.w; x += step) {
        if (data[(Math.round(y * dpr) * off.width + Math.round(x * dpr)) * 4 + 3] > 100) cells.push({ x, y });
      }
    }
    return { cells, image: off };
  }

  run({ fromCols, toCols, font, finalAlpha = 0.75, fromHex = '#38bdf8', toHex = '#ffd700', finalColor = [255, 215, 0] }) {
    this.stop();
    return new Promise((resolve) => {
      const { ctx, w, h } = this;
      const isMob = window.innerWidth < 768;
      const fromColor = parseColor(fromHex);
      const toColor = parseColor(toHex || finalColor);
      const { cells: from, image: fromImg } = this.sample(fromCols, font, fromColor);
      const { cells: to, image: toImg } = this.sample(toCols, font, toColor);
      if (!from.length || !to.length) { resolve(); return; }
      const solid = (img, alpha) => {
        if (alpha <= 0.002) return;
        ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore();
      };
      const step = this.step;

      const bounds = (cells) => cells.reduce((b, c) => ({
        minX: Math.min(b.minX, c.x), maxX: Math.max(b.maxX, c.x), minY: Math.min(b.minY, c.y), maxY: Math.max(b.maxY, c.y),
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      const fb = bounds(from);
      const tb = bounds(to);
      const cx = (tb.minX + tb.maxX) / 2, cy = (tb.minY + tb.maxY) / 2;
      const height = fb.maxY - fb.minY;
      const band = height * 0.18;

      const T = this.reduced
        ? { light: 0.2, burn: 0.7, drift: 0.35, reform: 0.7 }
        : { light: 0.45, burn: 2.0, drift: 0.65, reform: 1.6 };
      const total = T.light + T.burn + T.drift + T.reform;

      for (const c of from) { c.n = random(-1, 1); c.burnt = false; c.lit = -1; }
      const maxDist = Math.max(...to.map((c) => Math.hypot(c.x - cx, c.y - cy)));
      for (const c of to) {
        const d = Math.hypot(c.x - cx, c.y - cy);
        const a = Math.atan2(c.y - cy, c.x - cx) + random(-0.35, 0.35);
        const r = random(step * 4, step * 14 + maxDist * 0.25);
        c.sx = cx + Math.cos(a) * r;
        c.sy = cy + Math.sin(a) * r;
        c.angle = a;
        c.arc = random(-16, 16);
        c.delay = (d / maxDist) * 0.40 + random(0, 0.12);
        c.dur = random(0.65, 1.0);
        // Organic resting micro-jitter so settling looks like stardust, not a rigid LED matrix grid
        c.hx = c.x + random(-0.32, 0.32) * step;
        c.hy = c.y + random(-0.32, 0.32) * step;
      }

      const embers = [];
      const maxEmbers = isMob ? 220 : 800;
      const spawnEmber = (x, y, hot) => {
        if (embers.length > maxEmbers) return;
        embers.push({
          x, y,
          vx: random(-22, 22), vy: random(-30, -120),
          r: hot ? random(1.6, 3.2) : random(1, 2.4),
          life: 1, ttl: hot ? random(1.0, 2.0) : random(0.6, 1.4),
          color: hot ? [255, 210, 90] : fireAt(random(0.2, 0.8)),
          phase: random(0, Math.PI * 2),
        });
      };
      const bokeh = Array.from({ length: this.reduced ? 3 : (isMob ? 4 : 8) }, () => ({
        x: random(fb.minX - 120, fb.maxX + 120), y: random(fb.minY - 80, fb.maxY + 80),
        r: random(6, 14), vx: random(-8, 8), vy: random(-18, -6), a: 0, target: random(0.25, 0.55), phase: random(0, 6),
      }));

      let start = null, last = null;
      const frame = (now) => {
        if (start == null) { start = now; last = now; }
        const t = (now - start) / 1000;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        ctx.clearRect(0, 0, w, h);

        if (t < T.light) {
          // brighten from the dimmed grey to full white before the fire starts
          solid(fromImg, lerp(finalAlpha, 1, easeInQuad(t / T.light)));
        } else if (t < T.light + T.burn) {
          const p = (t - T.light) / T.burn;
          const fireY = fb.maxY + band - (height + band * 2) * p;   // rises from the bottom edge
          // Solid glyphs, with the burnt cells punched out so the edge crumbles along the noise.
          solid(fromImg, 1);
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = '#000';
          const burning = [];
          for (const c of from) {
            if (c.burnt) {
              ctx.fillRect(c.x - step * 0.5 - 0.5, c.y - step * 0.5 - 0.5, step + 1, h - c.y + step);
              continue;
            }
            const edge = fireY + c.n * band * 0.8;
            if (c.y > edge + band * 0.5) {
              c.burnt = true;
              ctx.fillRect(c.x - step * 0.5 - 0.5, c.y - step * 0.5 - 0.5, step + 1, h - c.y + step);
              if (Math.random() < 0.65) spawnEmber(c.x, c.y, Math.random() < 0.2);
              continue;
            }
            if (c.y > edge - band * 0.7) burning.push([c, clamp((c.y - (edge - band * 0.7)) / (band * 1.2), 0, 1)]);
          }
          // Clear everything safely below the burning front to avoid any bottom-edge line slivers
          const cleanBelowY = fireY + band * 1.35;
          if (cleanBelowY < fb.maxY + step * 4) {
            ctx.fillRect(fb.minX - 40, cleanBelowY, (fb.maxX - fb.minX) + 80, h - cleanBelowY + 10);
          }
          ctx.restore();

          for (const [c, k] of burning) {          // k: 0 just lit → 1 charred
            const flicker = 0.8 + 0.2 * Math.sin(t * 28 + c.n * 12);
            ctx.fillStyle = rgba(fireAt(k), flicker);
            ctx.fillRect(c.x - step * 0.55, c.y - step * 0.55, step * 1.1, step * 1.1);
          }
          this._glow((fb.minX + fb.maxX) / 2, fireY, (fb.maxX - fb.minX) * 0.75, 0.38 * (1 - p * 0.4), [255, 145, 45]);
        } else if (t < T.light + T.burn + T.drift) {
          const p = (t - T.light - T.burn) / T.drift;
          this._glow(cx, cy, height * 0.35, 0.55 * p, mix([255, 150, 50], toColor, p));
        } else if (t < total) {
          const t2 = t - T.light - T.burn - T.drift;
          const settledFrac = to.reduce((n, c) => n + (t2 - c.delay >= c.dur ? 1 : 0), 0) / to.length;
          // Smooth earlier dissolve into the radiant solid gold glyph
          const solidity = clamp((settledFrac - 0.12) / 0.78, 0, 1);
          const easeSolid = easeOutCubic(solidity);
          solid(toImg, finalAlpha * easeSolid);

          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          for (const c of to) {
            const local = clamp((t2 - c.delay) / c.dur, 0, 1);
            const e = easeOutCubic(local);
            const arc = Math.sin(local * Math.PI) * c.arc;
            const x = lerp(c.sx, c.hx, e) + Math.cos(c.angle + Math.PI / 2) * arc;
            const y = lerp(c.sy, c.hy, e) + Math.sin(c.angle + Math.PI / 2) * arc;
            const col = mix([255, 215, 120], toColor, e);
            const a = Math.min(1, local * 3.2) * (1 - easeSolid * 0.95);
            if (a <= 0.005) continue;
            ctx.fillStyle = rgba(col, a * 0.85);
            const r = (step * 0.56) * (0.8 + 0.3 * Math.sin(t * 14 + c.delay * 10));
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
          }
          ctx.restore();

          const pulse = 0.92 + 0.08 * Math.sin(t * 14);
          const glowAlpha = 0.62 * (1 - settledFrac * 0.65);
          this._glow(cx, cy, height * 0.44 * pulse, glowAlpha, toColor);
        } else {
          solid(toImg, finalAlpha);
          this._embers(embers, dt, t, true);
          this.raf = null;
          resolve();
          return;
        }

        this._embers(embers, dt, t);
        this._bokeh(bokeh, dt, t, t > T.light + T.burn * 0.5, t > T.light + T.burn + T.drift + T.reform * 0.6);
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  _glow(x, y, r, alpha, color) {
    if (alpha <= 0.005 || r <= 1) return;
    const { ctx } = this;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(0.45, rgba(color, alpha * 0.35));
    g.addColorStop(1, rgba(color, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  _embers(list, dt, t, freeze = false) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (!freeze) {
        p.life -= dt / p.ttl;
        if (p.life <= 0) { list.splice(i, 1); continue; }
        p.vy -= 14 * dt;
        p.vx += Math.sin(t * 4 + p.phase) * 18 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      const a = p.life * (0.65 + 0.35 * Math.sin(t * 18 + p.phase));
      ctx.fillStyle = rgba(p.color, a);
      const pr = p.r * (0.4 + 0.6 * p.life);
      ctx.fillRect(p.x - pr, p.y - pr, pr * 2, pr * 2);
    }
    ctx.restore();
  }

  _bokeh(list, dt, t, on, fading) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of list) {
      const goal = on && !fading ? b.target : 0;
      b.a = lerp(b.a, goal, dt * 1.4);
      b.x += (b.vx + Math.sin(t * 0.8 + b.phase) * 6) * dt;
      b.y += b.vy * dt;
      if (b.a < 0.01) continue;
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(210,225,255,${(b.a * 0.9).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(180,200,255,${(b.a * 0.35).toFixed(3)})`);
      g.addColorStop(1, 'rgba(180,200,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    ctx.restore();
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  destroy() {
    this.stop();
    this.ctx.clearRect(0, 0, this.w, this.h);
  }
}
