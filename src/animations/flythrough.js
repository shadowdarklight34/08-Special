import gsap from 'gsap';
import { el, asset } from '../utils/dom.js';
import { random, clamp } from '../utils/random.js';

/**
 * An interactive 3D Cosmos World of memories.
 * Features:
 * - Continuous slow auto-rotation (auto-orbit) around the memory galaxy
 * - 360° mouse drag / touch orbiting with smooth momentum
 * - Mouse parallax and scroll-wheel zoom
 * - Photos in a 3D celestial helix/constellation that ALWAYS face the viewer (no backward/mirrored cards)
 * - Hover billboarding, 3D lift, cosmic glass glow, and captions
 * - Click to open full-screen photo modal
 * - Celestial 3D orbital rings
 * - Auto-rotate toggle control
 */
export function createFlythrough(container, {
  photos,
  count = 12,
  reducedMotion = false,
  speed = 180,
  onPhotoClick = null,
  onCameraMove = null,
} = {}) {
  container.innerHTML = '';

  // 3D Viewport & Camera Rig
  const viewport = el('div', { class: 'world-3d' });
  const camera = el('div', { class: 'world-3d__camera' });
  viewport.append(camera);

  // 3D Orbital Rings
  const ring1 = el('div', { class: 'world-3d__ring world-3d__ring--1', 'aria-hidden': 'true' });
  const ring2 = el('div', { class: 'world-3d__ring world-3d__ring--2', 'aria-hidden': 'true' });
  camera.append(ring1, ring2);

  // Top exploration badge & auto-rotate toggle
  let autoRotate = true;
  const rotateBtn = el('button', {
    class: 'world-3d__rotate-toggle',
    type: 'button',
    text: '⟳ Auto-Orbit: ON',
    onClick: (e) => {
      e.stopPropagation();
      autoRotate = !autoRotate;
      rotateBtn.textContent = autoRotate ? '⟳ Auto-Orbit: ON' : '⏸ Auto-Orbit: OFF';
      rotateBtn.classList.toggle('is-paused', !autoRotate);
    },
  });

  const hintPill = el('div', { class: 'world-3d__hint' }, [
    el('span', { text: '✦ Drag to explore 3D Galaxy · Scroll to zoom ✦' }),
    rotateBtn,
  ]);
  container.append(viewport, hintPill);

  // Camera State
  let camRotX = 0, camRotY = 0, camZoomZ = 0;
  let targetRotX = 0, targetRotY = 0, targetZoomZ = 0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let dragStartRotX = 0, dragStartRotY = 0;
  let mouseParallaxX = 0, mouseParallaxY = 0;
  let isHoveringCard = false;

  // Auto-rotation speed: degrees per second
  const autoRotateSpeed = reducedMotion ? 0 : 5.2;

  // Distribute photos in a 3D cylindrical / helix constellation
  const totalPhotos = Math.min(count, photos.length * 2);
  const items = Array.from({ length: totalPhotos }, (_, i) => {
    const photo = photos[i % photos.length];
    const img = el('img', {
      src: asset(photo.src),
      alt: photo.alt || '',
      draggable: 'false',
      decoding: 'async',
    });

    const caption = el('div', { class: 'fly__caption', text: photo.caption || '' });
    const shine = el('div', { class: 'fly__shine', 'aria-hidden': 'true' });
    const card = el('div', {
      class: 'fly',
      role: 'button',
      tabindex: '0',
      'aria-label': photo.caption || 'View photo memory',
    }, [
      shine,
      el('div', { class: 'fly__img' }, [img]),
      caption,
    ]);

    card.dataset.src = photo.src;
    card.dataset.caption = photo.caption || '';

    // Card hover state
    card.addEventListener('pointerenter', () => {
      isHoveringCard = true;
      card.classList.add('is-hovered');
    });

    card.addEventListener('pointerleave', () => {
      isHoveringCard = false;
      card.classList.remove('is-hovered');
    });

    // Card click
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      onPhotoClick?.(photo, card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onPhotoClick?.(photo, card);
      }
    });

    camera.append(card);

    // Initial 3D placement in a cylinder / helix
    const angle = (i / totalPhotos) * Math.PI * 2 + random(-0.15, 0.15);
    const radius = random(400, 750);
    const height = random(-360, 360);
    const depth = random(-1200, 200);

    return {
      el: card,
      photo,
      angle,
      radius,
      y: height,
      z: depth,
      rotX: random(-8, 8),
      rotZ: random(-8, 8),
      orbitSpeed: (random(0.03, 0.06) * (Math.random() < 0.5 ? 1 : -1)) * (reducedMotion ? 0 : 1),
      phase: random(0, Math.PI * 2),
    };
  });

  // Pointer drag for 3D Camera Orbit
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('.fly, button, .final__content')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartRotX = targetRotX;
    dragStartRotY = targetRotY;
    viewport.classList.add('is-dragging');
  };

  const onPointerMove = (e) => {
    const w = window.innerWidth, h = window.innerHeight;
    mouseParallaxX = ((e.clientX / w) - 0.5) * 20;
    mouseParallaxY = -((e.clientY / h) - 0.5) * 16;

    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      targetRotY = dragStartRotY + dx * 0.35;
      targetRotX = clamp(dragStartRotX - dy * 0.28, -65, 65);
    }
  };

  const onPointerUp = () => {
    isDragging = false;
    viewport.classList.remove('is-dragging');
  };

  // Zoom via wheel
  const onWheel = (e) => {
    if (Math.abs(e.deltaY) < 1) return;
    targetZoomZ = clamp(targetZoomZ - e.deltaY * 0.8, -800, 600);
  };

  // Touch handlers
  let touchStartDist = 0;
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      onPointerDown(e.touches[0]);
    } else if (e.touches.length === 2) {
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 1) {
      onPointerMove(e.touches[0]);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - touchStartDist) * 1.5;
      touchStartDist = dist;
      targetZoomZ = clamp(targetZoomZ + delta, -800, 600);
    }
  };

  const onTouchEnd = () => onPointerUp();

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);

  // Main 3D Animation Loop
  let lastTime = performance.now();
  let time = 0;

  const tick = (now) => {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    time += dt;

    // Continuous slow auto-orbit
    if (!isDragging && autoRotate && !reducedMotion) {
      const effSpeed = autoRotateSpeed * (isHoveringCard ? 0.15 : 1);
      targetRotY += effSpeed * dt;
      targetRotX += (Math.sin(time * 0.35) * 5 - targetRotX) * 0.02;
    }

    // Smooth interpolation (lerp) for camera
    const lerpRate = 0.08;
    const effectiveTargetX = targetRotX + mouseParallaxY;
    const effectiveTargetY = targetRotY + mouseParallaxX;

    camRotX += (effectiveTargetX - camRotX) * lerpRate;
    camRotY += (effectiveTargetY - camRotY) * lerpRate;
    camZoomZ += (targetZoomZ - camZoomZ) * lerpRate;

    camera.style.transform = `translateZ(${camZoomZ.toFixed(1)}px) rotateX(${camRotX.toFixed(2)}deg) rotateY(${camRotY.toFixed(2)}deg)`;

    // Notify Starfield of camera rotation for parallax
    onCameraMove?.(camRotX, camRotY);

    // Update 3D Photo Cards
    const speedMult = isHoveringCard ? 0.2 : 1;
    for (const it of items) {
      if (!reducedMotion) {
        it.angle += it.orbitSpeed * dt * speedMult;
        it.y += Math.sin(time + it.phase) * 0.3;
      }

      const x = Math.cos(it.angle) * it.radius;
      const z = Math.sin(it.angle) * it.radius + it.z;
      const y = it.y;

      // Distance to camera for depth fog and opacity
      const distFromCam = z + camZoomZ;
      const opacity = clamp(1 - (Math.abs(distFromCam) / 1800), 0.35, 1);

      // Crucial: Calculate face angle so front of card ALWAYS faces towards the camera center
      const faceAngle = Math.atan2(x, z) * (180 / Math.PI) + 180;

      it.el.style.opacity = String(opacity);
      it.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${faceAngle.toFixed(1)}deg) rotateX(${it.rotX}deg) rotateZ(${it.rotZ}deg)`;
    }
  };

  gsap.ticker.add(tick);

  // Fade in 3D world elements
  gsap.fromTo(viewport, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' });
  gsap.fromTo(hintPill, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 1, delay: 1 });

  return {
    viewport,
    camera,
    destroy() {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      viewport.remove();
      hintPill.remove();
    },
  };
}
