import { random } from '../utils/random.js';
import { devicePixelRatio } from '../utils/device.js';

/**
 * 3D Starfield & Cosmic Nebula:
 * Multi-layered stars with camera parallax, cosmic haze, and shooting stars.
 */
export class Starfield {
  constructor(canvas, { count = 240, reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.count = count;
    this.reducedMotion = reducedMotion;
    this.stars = [];
    this.motes = [];
    this.shootingStars = [];
    this.camX = 0;
    this.camY = 0;
    this.targetCamX = 0;
    this.targetCamY = 0;
    this.raf = null;
    this.t = 0;
    this.nextCometTime = performance.now() + random(2000, 4500);

    this._onResize = () => { this.resize(); this._seed(); if (this.reducedMotion) this._draw(0); };
    window.addEventListener('resize', this._onResize);
    this.resize();
    this._seed();
  }

  resize() {
    const dpr = devicePixelRatio();
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setCamera(rotX, rotY) {
    this.targetCamY = (rotX / 60) * (this.h * 0.2);
    this.targetCamX = -(rotY / 60) * (this.w * 0.2);
  }

  _seed() {
    const isMob = window.innerWidth < 768;
    const actualCount = isMob ? Math.min(this.count, 130) : this.count;
    this.stars = Array.from({ length: actualCount }, () => ({
      x: random(0, this.w),
      y: random(0, this.h),
      depth: random(0.3, 1.8), // Parallax depth layer
      r: random(0.6, 2.0),
      alpha: random(0.35, 1),
      speed: random(0.4, 1.6),
      phase: random(0, Math.PI * 2),
      color: Math.random() < 0.2 ? '#fde047' : (Math.random() < 0.3 ? '#93c5fd' : '#ffffff'),
    }));

    this.motes = Array.from({ length: Math.round(actualCount / 12) }, () => ({
      x: random(0, this.w),
      y: random(0, this.h),
      depth: random(0.2, 0.8),
      r: random(2, 4),
      vy: random(-0.25, -0.06),
      vx: random(-0.08, 0.08),
      alpha: random(0.08, 0.25),
      phase: random(0, Math.PI * 2),
      color: Math.random() < 0.5 ? '#f59e0b' : '#818cf8',
    }));
  }

  _spawnComet() {
    if (this.reducedMotion || this.shootingStars.length >= 2) return;
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? random(-50, this.w * 0.4) : random(this.w * 0.6, this.w + 50);
    const startY = random(-40, this.h * 0.4);
    const angle = fromLeft ? random(0.3, 0.8) : random(2.3, 2.8);
    const speed = random(14, 22);

    this.shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: random(80, 160),
      size: random(1.5, 3),
      alpha: 1,
      decay: random(0.015, 0.025),
    });
  }

  start() {
    if (this.reducedMotion) { this._draw(0); return; }
    if (this.raf) return;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      this.t += 0.016 * dt;

      // Smooth camera parallax
      this.camX += (this.targetCamX - this.camX) * 0.08;
      this.camY += (this.targetCamY - this.camY) * 0.08;

      // Drifting motes
      for (const m of this.motes) {
        m.y += m.vy * dt;
        m.x += (m.vx + Math.sin(this.t + m.phase) * 0.05) * dt;
        if (m.y < -15) { m.y = this.h + 15; m.x = random(0, this.w); }
      }

      // Shooting stars spawn check
      if (now > this.nextCometTime) {
        this._spawnComet();
        this.nextCometTime = now + random(2500, 6000);
      }

      // Update shooting stars
      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const s = this.shootingStars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.alpha -= s.decay * dt;
        if (s.alpha <= 0 || s.x > this.w + 200 || s.y > this.h + 200) {
          this.shootingStars.splice(i, 1);
        }
      }

      this._draw(this.t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  _draw(t) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    // Render stars with parallax
    for (const s of this.stars) {
      const tw = this.reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(t * s.speed * 2.2 + s.phase);
      const px = s.x + this.camX * s.depth;
      const py = s.y + this.camY * s.depth;

      // Wrap-around screen bounds
      const wrappedX = ((px % w) + w) % w;
      const wrappedY = ((py % h) + h) % h;

      ctx.globalAlpha = s.alpha * tw;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(wrappedX, wrappedY, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render motes
    for (const m of this.motes) {
      const px = ((m.x + this.camX * m.depth) % w + w) % w;
      const py = ((m.y + this.camY * m.depth) % h + h) % h;
      ctx.globalAlpha = m.alpha * (0.7 + 0.3 * Math.sin(t + m.phase));
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(px, py, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render shooting stars / comets
    for (const s of this.shootingStars) {
      const headX = s.x;
      const headY = s.y;
      const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.length;
      const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.length;

      const cometGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
      cometGrad.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
      cometGrad.addColorStop(0.3, `rgba(251, 191, 36, ${s.alpha * 0.8})`);
      cometGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = cometGrad;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Glowing head spark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX, headY, s.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this._onResize);
    this.ctx.clearRect(0, 0, this.w, this.h);
  }
}
