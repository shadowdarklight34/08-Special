import { random, pick } from '../utils/random.js';
import { devicePixelRatio } from '../utils/device.js';

const CONFETTI_COLORS = [
  '#f59e0b', '#fbbf24', '#f43f5e', '#ec4899', '#8b5cf6',
  '#38bdf8', '#34d399', '#fef08a', '#fda4af', '#e0e7ff',
];

const SHAPES = ['rect', 'circle', 'heart', 'ribbon'];

/**
 * High-performance celebration confetti generator.
 * Can run a floating shower (BirthdayScene) or a punchy radial burst (HeroScene).
 */
export class ConfettiCannon {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-canvas';
    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '15',
    });
    this.ctx = this.canvas.getContext('2d');
    container.append(this.canvas);

    this.particles = [];
    this.raf = null;
    this.lastTime = performance.now();
    this.isSpawningShower = false;
    this.showerTimer = null;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize() {
    const dpr = devicePixelRatio();
    this.w = this.container.clientWidth || window.innerWidth;
    this.h = this.container.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Radial explosive burst at a specific coordinate (e.g. on click).
   */
  burst(x, y, { count = 40, spread = 360 } = {}) {
    this.resize();
    const angleRad = (spread * Math.PI) / 180;
    const baseAngle = -Math.PI / 2;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * angleRad;
      const speed = random(4, 12);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + random(-1.5, 1.5),
        vy: Math.sin(angle) * speed - random(1, 4),
        size: random(6, 12),
        color: pick(CONFETTI_COLORS),
        shape: pick(SHAPES),
        rotation: random(0, Math.PI * 2),
        rotSpeed: random(-0.2, 0.2),
        oscillation: random(0.05, 0.15),
        oscSpeed: random(0.04, 0.1),
        gravity: random(0.18, 0.28),
        drag: 0.985,
        alpha: 1,
        life: 1,
        decay: random(0.008, 0.016),
      });
    }

    if (!this.raf) this._loop();
  }

  /**
   * Sustained festive shower falling from the top.
   */
  startShower({ duration = 5000, rate = 4 } = {}) {
    this.isSpawningShower = true;
    if (!this.raf) this._loop();
    const isMob = window.innerWidth < 768;
    const actualRate = isMob ? Math.min(rate, 2) : rate;
    const intervalMs = isMob ? 110 : 80;

    const spawn = () => {
      if (!this.isSpawningShower) return;
      for (let i = 0; i < actualRate; i++) {
        this.particles.push({
          x: random(0, this.w),
          y: random(-20, -5),
          vx: random(-1.2, 1.2),
          vy: random(1.8, 3.8),
          size: random(7, 13),
          color: pick(CONFETTI_COLORS),
          shape: pick(SHAPES),
          rotation: random(0, Math.PI * 2),
          rotSpeed: random(-0.08, 0.08),
          oscillation: random(0.04, 0.12),
          oscSpeed: random(0.03, 0.07),
          gravity: 0.05,
          drag: 0.995,
          alpha: 1,
          life: 1,
          decay: random(0.002, 0.005),
        });
      }
    };

    const interval = setInterval(spawn, intervalMs);
    this.showerTimer = setTimeout(() => {
      this.isSpawningShower = false;
      clearInterval(interval);
    }, duration);
  }

  _loop() {
    const now = performance.now();
    const dt = Math.min(2.5, (now - this.lastTime) / 16.67);
    this.lastTime = now;

    this.ctx.clearRect(0, 0, this.w, this.h);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(p.drag, dt);
      p.vy *= Math.pow(p.drag, dt);
      p.x += (p.vx + Math.sin(now * p.oscSpeed) * p.oscillation * 8) * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      p.life -= p.decay * dt;
      p.alpha = Math.max(0, p.life);

      if (p.life <= 0 || p.y > this.h + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'heart') {
        const s = p.size * 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(0, s * 0.3);
        this.ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s);
        this.ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3);
        this.ctx.fill();
      } else if (p.shape === 'ribbon') {
        this.ctx.fillRect(-p.size / 2, -p.size * 0.25, p.size, p.size * 0.5);
      } else {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      this.ctx.restore();
    }

    if (this.particles.length > 0 || this.isSpawningShower) {
      this.raf = requestAnimationFrame(() => this._loop());
    } else {
      this.raf = null;
    }
  }

  destroy() {
    this.isSpawningShower = false;
    clearTimeout(this.showerTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    this.canvas.remove();
  }
}
