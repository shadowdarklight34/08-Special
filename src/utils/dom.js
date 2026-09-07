/** Tiny DOM helpers so scenes read like templates instead of createElement soup. */

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key.startsWith('--')) node.style.setProperty(key, value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Resolve a `/public`-style path against Vite's BASE_URL so sub-folder deploys work. */
export function asset(path) {
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/?$/, '/') + String(path).replace(/^\/+/, '');
}

export const HEART_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

/**
 * Measures the exact bounding rectangles of individual digits in a big number string,
 * positioned with the exact styling of target element (e.g. `birthday__number`).
 */
export function measureDigits(text, container, className = '') {
  const probe = el('div', {
    class: `bignum ${className}`.trim(),
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      visibility: 'hidden',
      pointerEvents: 'none',
    },
  });
  const chars = String(text).split('');
  const spans = chars.map((ch) => el('span', { text: ch, style: { display: 'inline-block' } }));
  probe.append(...spans);
  container.append(probe);
  const cs = getComputedStyle(probe);
  const cols = spans.map((span, i) => ({
    digit: chars[i],
    rect: span.getBoundingClientRect(),
    visible: true,
  }));
  const font = {
    family: cs.fontFamily,
    weight: cs.fontWeight,
    size: parseFloat(cs.fontSize),
    letterSpacing: cs.letterSpacing,
  };
  probe.remove();
  return { cols, font };
}

