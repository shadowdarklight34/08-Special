import gsap from 'gsap';
import { el, asset } from '../utils/dom.js';
import { random } from '../utils/random.js';

/**
 * An interactive filmstrip ribbon of photos travelling along a looping path.
 * Dynamically computes viewport-relative paths so photos are ALWAYS large,
 * visible, beautiful, and perfectly positioned on both mobile and desktop.
 */
export function createPhotoTrail(container, {
  photos,
  count = 12,
  reducedMotion = false,
  lapSeconds = 30,
  onPhotoClick = null,
} = {}) {
  // Hidden SVG for getPointAtLength
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, { position: 'absolute', width: '0', height: '0', overflow: 'hidden', pointerEvents: 'none' });
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.append(path);
  container.append(svg);

  const SAMPLES = 1000;
  const table = [];
  let W = container.clientWidth || window.innerWidth;
  let H = container.clientHeight || window.innerHeight;
  let isPortrait = H > W;

  const buildPathTable = () => {
    W = container.clientWidth || window.innerWidth;
    H = container.clientHeight || window.innerHeight;
    isPortrait = H > W;

    let d;
    if (isPortrait) {
      // Mobile / Portrait:
      // Perfectly centered in the open window between hint badge (~44%) and Continue button (~86%)
      const yMid = H * 0.60;
      const amp = Math.min(20, H * 0.025);
      d = `M ${-140} ${yMid} C ${W * 0.22} ${yMid - amp}, ${W * 0.46} ${yMid + amp}, ${W * 0.72} ${yMid - amp * 0.8} C ${W * 0.88} ${yMid + amp * 0.6}, ${W * 1.05} ${yMid - amp * 0.3}, ${W + 160} ${yMid}`;
    } else {
      // Desktop / Landscape:
      // Left 44% is copy. Right 56% is the flowing ribbon
      const xStart = W * 0.40;
      const xEnd = W + 160;
      const yTop = H * 0.25;
      const yBot = H * 0.75;
      d = `M ${xStart - 40} ${yBot} C ${W * 0.52} ${yBot + 35}, ${W * 0.64} ${H * 0.54}, ${W * 0.75} ${H * 0.44} C ${W * 0.85} ${yTop - 25}, ${W * 0.95} ${yTop + 45}, ${xEnd} ${H * 0.36}`;
    }

    path.setAttribute('d', d);
    const length = path.getTotalLength();
    table.length = 0;
    for (let i = 0; i <= SAMPLES; i++) {
      const p = path.getPointAtLength((i / SAMPLES) * length);
      const q = path.getPointAtLength(Math.min(length, (i / SAMPLES) * length + 1));
      table.push({ x: p.x, y: p.y, a: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI });
    }
  };

  buildPathTable();

  const at = (u) => {
    const f = (((u % 1) + 1) % 1) * SAMPLES;
    const i = Math.floor(f);
    const t = f - i;
    const a = table[i] || table[0];
    const b = table[Math.min(SAMPLES, i + 1)] || a;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, a: a.a };
  };

  const layer = el('div', { class: 'trail' });

  // Speed controls: ease down smoothly on hover
  let speedFactor = { val: 1 };
  let isDragging = false;
  let dragStartX = 0;
  let dragStartU = 0;
  let uOffset = 0;

  const tiles = Array.from({ length: count }, (_, i) => {
    const photo = photos[i % photos.length];
    const img = el('img', {
      src: asset(photo.src),
      alt: photo.alt || '',
      draggable: 'false',
      loading: i < 8 ? 'eager' : 'lazy',
      decoding: 'async',
    });

    const TAPE_PALETTE = [
      { bg: 'rgba(245, 158, 11, 0.65)', rot: -3 },
      { bg: 'rgba(244, 114, 182, 0.65)', rot: 3 },
      { bg: 'rgba(56, 189, 248, 0.65)', rot: -2 },
      { bg: 'rgba(168, 85, 247, 0.65)', rot: 2 },
      { bg: 'rgba(52, 211, 153, 0.65)', rot: -3 },
      { bg: 'rgba(251, 146, 60, 0.65)', rot: 3 },
    ];
    const tapeSpec = TAPE_PALETTE[i % TAPE_PALETTE.length];
    const tape = el('span', {
      class: 'trail__tape',
      'aria-hidden': 'true',
      style: {
        background: tapeSpec.bg,
        transform: `translateX(-50%) rotate(${tapeSpec.rot}deg)`,
      },
    });

    const chinText = photo.caption ? photo.caption.replace(/[^\w\s✨🌸🍰🎂🎧💫👑]/gi, '').trim() : `Memory 0${(i % 9) + 1}`;
    const chinCaption = el('span', { class: 'trail__chin-caption', text: chinText });
    const tooltipCaption = el('span', { class: 'trail__caption', text: photo.caption || '' });

    const tile = el('div', {
      class: 'trail__tile',
      role: 'button',
      tabindex: '0',
      'aria-label': photo.caption || photo.alt || 'View photo memory',
    }, [tape, img, chinCaption, tooltipCaption]);

    tile.dataset.src = photo.src;
    tile.dataset.caption = photo.caption || '';
    tile.dataset.alt = photo.alt || '';

    // Hover slowdown + zoom
    tile.addEventListener('pointerenter', () => {
      tile.classList.add('is-hovered');
      gsap.to(speedFactor, { val: 0.1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    });

    tile.addEventListener('pointerleave', () => {
      tile.classList.remove('is-hovered');
      gsap.to(speedFactor, { val: 1, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
    });

    // Click to open modal
    tile.addEventListener('click', (e) => {
      e.stopPropagation();
      onPhotoClick?.(photo, tile);
    });

    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onPhotoClick?.(photo, tile);
      }
    });

    layer.append(tile);

    return {
      el: tile,
      baseU: i / count,
      u: i / count,
      tilt: random(-6, 6),
      setX: gsap.quickSetter(tile, 'x', 'px'),
      setY: gsap.quickSetter(tile, 'y', 'px'),
      setR: gsap.quickSetter(tile, 'rotation', 'deg'),
    };
  });

  container.append(layer);
  gsap.set(tiles.map((t) => t.el), { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });

  const place = (tile) => {
    const p = at(tile.u + uOffset);
    tile.setX(p.x);
    tile.setY(p.y);
    const clampedAngle = Math.max(-14, Math.min(14, p.a * 0.25));
    tile.setR(clampedAngle + tile.tilt);
  };
  tiles.forEach(place);

  // Dragging / scrubbing along ribbon
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('.trail__tile')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartU = uOffset;
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    uOffset = dragStartU + (dx / Math.max(400, W)) * 0.8;
    tiles.forEach(place);
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  const speed = 1 / lapSeconds;
  const tick = (time, deltaMs) => {
    if (isDragging) return;
    const dt = Math.min(0.05, deltaMs / 1000);
    const effSpeed = speed * speedFactor.val;
    for (const tile of tiles) {
      tile.u += effSpeed * dt;
      place(tile);
    }
  };

  const onResize = () => {
    buildPathTable();
    tiles.forEach(place);
  };
  window.addEventListener('resize', onResize);

  if (!reducedMotion) gsap.ticker.add(tick);

  // Cinematic reveal stagger
  const reveal = gsap.to(tiles.map((t) => t.el), {
    autoAlpha: 1,
    scale: 1,
    duration: reducedMotion ? 0.4 : 0.95,
    ease: 'back.out(1.7)',
    stagger: { each: 0.04, from: 'start' },
  });

  return {
    layer,
    destroy() {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      reveal.kill();
      layer.remove();
      svg.remove();
    },
  };
}
