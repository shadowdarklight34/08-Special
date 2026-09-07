import { el, asset } from '../utils/dom.js';

const PINS = [
  // 1. Ruby Heart Pin
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#f43f5e"/>' +
  '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#pinShine-red)" opacity=".6"/>' +
  '<ellipse cx="8" cy="7.4" rx="1.8" ry="1.1" fill="#fff" opacity=".85" transform="rotate(-28 8 7.4)"/>' +
  '</svg>',

  // 2. Gold Star Pin
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 2l2.9 6.6 7.1.6-5.3 4.8 1.6 7-6.3-3.8-6.3 3.8 1.6-7-5.3-4.8 7.1-.6z" fill="#f59e0b"/>' +
  '<circle cx="12" cy="11.5" r="2.2" fill="#fff" opacity=".85"/>' +
  '</svg>',

  // 3. Daisy Bloom Pin
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<circle cx="12" cy="6" r="3.2" fill="#ffffff"/>' +
  '<circle cx="18" cy="12" r="3.2" fill="#ffffff"/>' +
  '<circle cx="12" cy="18" r="3.2" fill="#ffffff"/>' +
  '<circle cx="6" cy="12" r="3.2" fill="#ffffff"/>' +
  '<circle cx="7.8" cy="7.8" r="3" fill="#ffffff"/>' +
  '<circle cx="16.2" cy="7.8" r="3" fill="#ffffff"/>' +
  '<circle cx="16.2" cy="16.2" r="3" fill="#ffffff"/>' +
  '<circle cx="7.8" cy="16.2" r="3" fill="#ffffff"/>' +
  '<circle cx="12" cy="12" r="3.6" fill="#f59e0b"/>' +
  '<circle cx="11.2" cy="11.2" r="1.3" fill="#ffffff" opacity=".9"/>' +
  '</svg>',

  // 4. Pastel Washi Tape Strip
  '<div class="polaroid__washi-tape" aria-hidden="true"></div>',

  // 5. Cosmic Lavender Heart
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#a855f7"/>' +
  '<ellipse cx="8" cy="7.4" rx="1.8" ry="1.1" fill="#fff" opacity=".85" transform="rotate(-28 8 7.4)"/>' +
  '</svg>',

  // 6. Rose Gold Metallic Pushpin
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="8" fill="#fb7185"/>' +
  '<circle cx="12" cy="12" r="6" fill="#f43f5e"/>' +
  '<circle cx="10.5" cy="10.5" r="2.8" fill="#ffffff" opacity=".85"/>' +
  '</svg>',
];

/** A polaroid with a glossy pin or tape pinned to its corner. Draggable by the scene; Enter/Space opens it. */
export function createPolaroid({ src, alt = '', caption = '' }, { rotation = 0, eager = false, pinIndex = 0 } = {}) {
  const img = el('img', {
    src: asset(src), alt, draggable: 'false',
    loading: eager ? 'eager' : 'lazy', decoding: 'async',
  });
  const pinContent = PINS[pinIndex % PINS.length];
  const pinEl = pinContent.startsWith('<div')
    ? el('div', { html: pinContent })
    : el('span', { class: 'polaroid__pin', html: pinContent, 'aria-hidden': 'true' });

  return el('div', {
    class: 'polaroid',
    role: 'button',
    tabindex: '0',
    'aria-label': caption ? `Open photo: ${caption}` : 'Open photo',
    dataset: { src, caption, alt, rot: String(rotation) },
  }, [
    el('div', { class: 'polaroid__image' }, [img]),
    el('div', { class: 'polaroid__caption', text: caption || ' ' }),
    pinEl,
  ]);
}

/** One shared gradient for pin highlight. */
export function mountPinDefs() {
  if (document.getElementById('pinShine-red')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = '<defs>' +
    '<radialGradient id="pinShine-red" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ffb4af"/><stop offset="60%" stop-color="#f43f5e" stop-opacity="0"/></radialGradient>' +
    '</defs>';
  document.body.append(svg);
}
