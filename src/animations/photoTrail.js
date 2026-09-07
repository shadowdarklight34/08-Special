import gsap from 'gsap';
import { el, asset } from '../utils/dom.js';
import { random } from '../utils/random.js';

/**
 * An interactive filmstrip ribbon of photos travelling along a looping path.
 * Photos sit at equal arc-length intervals, rotating with the path tangent.
 * 
 * Features:
 * - Smooth deceleration on hover so the user can comfortably inspect memories
 * - Hover elevation with 3D shadow and animated caption tooltip
 * - Direct click to open photo modal
 * - Interactive dragging/scrubbing along the loop
 */
const PATHS = {
  landscape: {
    box: { w: 1000, h: 600 },
    d: 'M 350 630 C 400 550, 460 480, 530 435 C 470 395, 455 295, 520 240 C 585 190, 695 210, 715 300 C 730 375, 675 450, 600 440 C 730 430, 870 395, 1010 340 C 1070 315, 1120 290, 1180 270',
  },
  portrait: {
    box: { w: 600, h: 1000 },
    // Gentle sweeping ribbon across the lower screen (y: 740-820, safely below text)
    d: 'M -80 810 C 100 750, 220 830, 340 770 C 450 720, 530 800, 680 760',
  },
};

export function createPhotoTrail(container, {
  photos,
  count = 24,
  reducedMotion = false,
  lapSeconds = 30,
  onPhotoClick = null,
} = {}) {
  const orientation = container.clientHeight > container.clientWidth ? 'portrait' : 'landscape';
  const spec = PATHS[orientation];

  // Hidden SVG for getPointAtLength
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, { position: 'absolute', width: '0', height: '0', overflow: 'hidden', pointerEvents: 'none' });
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', spec.d);
  svg.append(path);
  container.append(svg);

  // Sample path once into a lookup table
  const length = path.getTotalLength();
  const SAMPLES = 1000;
  const table = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const p = path.getPointAtLength((i / SAMPLES) * length);
    const q = path.getPointAtLength(Math.min(length, (i / SAMPLES) * length + 1));
    table.push({ x: p.x, y: p.y, a: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI });
  }
  const at = (u) => {
    const f = (((u % 1) + 1) % 1) * SAMPLES;
    const i = Math.floor(f);
    const t = f - i;
    const a = table[i];
    const b = table[Math.min(SAMPLES, i + 1)];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, a: a.a };
  };

  // Contain-fit authored box inside container
  let scale = 1, ox = 0, oy = 0;
  const fit = () => {
    const W = container.clientWidth, H = container.clientHeight;
    scale = Math.min(W / spec.box.w, H / spec.box.h);
    ox = (W - spec.box.w * scale) / 2;
    oy = (H - spec.box.h * scale) / 2;
  };
  fit();

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
      loading: i < 12 ? 'eager' : 'lazy',
      decoding: 'async',
    });

    const TAPE_PALETTE = [
      { bg: 'rgba(245, 158, 11, 0.48)', rot: -4 },
      { bg: 'rgba(244, 114, 182, 0.48)', rot: 3 },
      { bg: 'rgba(56, 189, 248, 0.48)', rot: -2 },
      { bg: 'rgba(168, 85, 247, 0.48)', rot: 4 },
      { bg: 'rgba(52, 211, 153, 0.48)', rot: -3 },
      { bg: 'rgba(251, 146, 60, 0.48)', rot: 2 },
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
    const caption = el('span', { class: 'trail__caption', text: photo.caption || '' });
    const tile = el('div', {
      class: 'trail__tile',
      role: 'button',
      tabindex: '0',
      'aria-label': photo.caption || photo.alt || 'View photo memory',
    }, [tape, img, caption]);

    tile.dataset.src = photo.src;
    tile.dataset.caption = photo.caption || '';
    tile.dataset.alt = photo.alt || '';

    // Hover slowdown + zoom
    tile.addEventListener('pointerenter', () => {
      tile.classList.add('is-hovered');
      gsap.to(speedFactor, { val: 0.08, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
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
      tilt: random(-8, 8),
      setX: gsap.quickSetter(tile, 'x', 'px'),
      setY: gsap.quickSetter(tile, 'y', 'px'),
      setR: gsap.quickSetter(tile, 'rotation', 'deg'),
    };
  });

  container.append(layer);
  gsap.set(tiles.map((t) => t.el), { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });

  const place = (tile) => {
    const p = at(tile.u + uOffset);
    tile.setX(ox + p.x * scale);
    tile.setY(oy + p.y * scale);
    tile.setR(p.a * 0.92 + tile.tilt);
  };
  tiles.forEach(place);

  // Dragging / scrubbing along ribbon
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('.trail__tile')) return; // let tile handle clicks
    isDragging = true;
    dragStartX = e.clientX;
    dragStartU = uOffset;
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    uOffset = dragStartU + (dx / (spec.box.w * scale)) * 0.7;
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
    fit();
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
    stagger: { each: 0.035, from: 'end' },
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
