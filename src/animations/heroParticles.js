import { random } from '../utils/random.js';
import { devicePixelRatio } from '../utils/device.js';

/**
 * Ambient golden stardust + interactive mouse sparkle trail for the Hero scene.
 */
export class HeroParticles {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reducedMotion = reducedMotion;
    this.ambient = [];
    this.sparkles = [];
    this.raf = null;
    this.lastTime = performance.now();

    this._onResize = () => this.resize();
    this._onPointerMove = (e) => this.addSparkle(e.clientX, e.clientY);
    this._onTouchMove = (e) => {
      if (e.touches?.[0]) this.addSparkle(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('resize', this._onResize);
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: true });

    this.resize();
    this._initAmbient();
  }

  resize() {
    const dpr = devicePixelRatio();
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _initAmbient() {
    const count = Math.min(36, Math.max(16, Math.round(this.w / 45)));
    this.ambient = Array.from({ length: count }, () => ({
      x: random(0, this.w),
      y: random(0, this.h),
      r: random(1.2, 2.6),
      vx: random(-0.25, 0.25),
      vy: random(-0.35, -0.08),
      alpha: random(0.2, 0.55),
      phase: random(0, Math.PI * 2),
      speed: random(0.8, 1.8),
      color: Math.random() < 0.65 ? 'rgba(217, 119, 6, ' : 'rgba(245, 158, 11, ',
    }));
  }

  addSparkle(x, y) {
    if (this.reducedMotion) return;
    if (Math.random() < 0.35) return; // Throttling for delicate visual density
    this.sparkles.push({
      x: x + random(-6, 6),
      y: y + random(-6, 6),
      vx: random(-0.8, 0.8),
      vy: random(-1.2, -0.2),
      size: random(4, 9),
      alpha: 1,
      life: 1,
      decay: random(0.02, 0.035),
      color: Math.random() < 0.5 ? '#f59e0b' : '#fbbf24',
      isHeart: Math.random() < 0.25,
      rot: random(0, Math.PI * 2),
    });
    if (!this.raf) this.start();
  }

  start() {
    if (this.raf) return;
    this.lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min(2.5, (now - this.lastTime) / 16.67);
      this.lastTime = now;
      this._update(dt, now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  _update(dt, now) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    // 1. Ambient drifting stardust
    for (const a of this.ambient) {
      if (!this.reducedMotion) {
        a.x += (a.vx + Math.sin(now * 0.001 * a.speed + a.phase) * 0.15) * dt;
        a.y += a.vy * dt;
        if (a.y < -10) { a.y = h + 10; a.x = random(0, w); }
        if (a.x < -10) a.x = w + 10;
        if (a.x > w + 10) a.x = -10;
      }
      const tw = this.reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(now * 0.003 * a.speed + a.phase);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = `${a.color}${a.alpha * tw})`;
      ctx.fill();
    }

    // 2. Interactive sparkles trail
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= s.decay * dt;
      s.alpha = Math.max(0, s.life);

      if (s.life <= 0) {
        this.sparkles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.color;

      if (s.isHeart) {
        const sz = s.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, sz * 0.3);
        ctx.bezierCurveTo(-sz * 0.5, -sz * 0.3, -sz, sz * 0.1, 0, sz);
        ctx.bezierCurveTo(sz, sz * 0.1, sz * 0.5, -sz * 0.3, 0, sz * 0.3);
        ctx.fill();
      } else {
        // 4-point twinkle star
        const r = s.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('touchmove', this._onTouchMove);
    this.ctx.clearRect(0, 0, this.w, this.h);
  }
}
