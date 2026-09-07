import { random, pick, randomSign } from '../utils/random.js';

/** Glossy party colours: [light, mid, dark] per balloon. */
const PALETTE = [
  ['#ff758c', '#ff3366', '#c6003b'],   // romantic rose
  ['#ffe066', '#ffd123', '#d49b00'],   // golden sun
  ['#6ee7b7', '#10b981', '#047857'],   // emerald mint
  ['#a78bfa', '#8b5cf6', '#5b21b6'],   // royal violet
  ['#38bdf8', '#0ea5e9', '#0369a1'],   // baby blue
  ['#f472b6', '#ec4899', '#be185d'],   // hot bubblegum
  ['#fb923c', '#f97316', '#c2410c'],   // coral sunset
  ['#fbcfe8', '#f43f5e', '#9f1239'],   // strawberry cream
  ['#c084fc', '#d946ef', '#86198f'],   // orchid fuchsia
];

/**
 * Generates `count` CSS-animated balloons with random position, size, tilt,
 * delay and speed. Includes heart balloons and close-up depth balloons.
 * Returns a destroy() that removes them all.
 */
export function createBalloons(container, { count = 22, reducedMotion = false, spread = 5 } = {}) {
  const frag = document.createDocumentFragment();
  const balloons = [];

  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    const near = Math.random() < 0.22;
    const isHeart = Math.random() < 0.38;
    const [c1, c2, c3] = pick(PALETTE);
    b.className = `balloon${near ? ' balloon--near' : ''}${isHeart ? ' balloon--heart' : ''}`;
    b.setAttribute('aria-hidden', 'true');
    b.style.setProperty('--x', `${random(2, 94)}%`);
    b.style.setProperty('--size', `${near ? random(140, 220) : random(65, 120)}px`);
    b.style.setProperty('--rot', `${random(-12, 12)}deg`);
    b.style.setProperty('--sway', `${random(18, 70) * randomSign()}px`);
    b.style.setProperty('--delay', `${reducedMotion ? 0 : random(0, spread)}s`);
    b.style.setProperty('--duration', `${near ? random(9, 12) : random(10, 15)}s`);
    b.style.setProperty('--c1', c1);
    b.style.setProperty('--c2', c2);
    b.style.setProperty('--c3', c3);
    b.style.zIndex = near ? '3' : String(Math.random() < 0.5 ? 1 : 2);
    if (reducedMotion) {
      b.style.animation = 'none';
      b.style.bottom = `${random(8, 70)}vh`;
    }
    if (isHeart) {
      const gradId = `hg-${i}-${Math.random().toString(36).slice(2, 7)}`;
      b.innerHTML = `
        <svg class="balloon__heart-svg" viewBox="0 0 100 95" preserveAspectRatio="none">
          <defs>
            <radialGradient id="${gradId}" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.88"/>
              <stop offset="22%" stop-color="${c1}"/>
              <stop offset="60%" stop-color="${c2}"/>
              <stop offset="100%" stop-color="${c3}"/>
            </radialGradient>
          </defs>
          <path d="M 50,28 C 50,14 36,4 23,4 C 10,4 0,16 0,32 C 0,58 35,80 50,94 C 65,80 100,58 100,32 C 100,16 90,4 77,4 C 64,4 50,14 50,28 Z" fill="url(#${gradId})"/>
        </svg>
      `;
    }
    frag.append(b);
    balloons.push(b);
  }
  container.append(frag);

  return () => balloons.forEach((b) => b.remove());
}
