import { el } from '../utils/dom.js';

/** Small dots showing where the viewer is in the story. Purely visual (aria-hidden). */
export function mountProgressIndicator(mount, { order, state, skip = ['loading'] }) {
  const steps = order.filter((name) => !skip.includes(name));
  const dots = new Map();
  const wrap = el('div', { class: 'progress-indicator', 'aria-hidden': 'true' });
  for (const name of steps) {
    const dot = el('span', { class: 'progress-indicator__dot', dataset: { scene: name } });
    dots.set(name, dot);
    wrap.append(dot);
  }
  mount.append(wrap);

  const render = ({ currentScene }) => {
    const idx = steps.indexOf(currentScene);
    steps.forEach((name, i) => {
      const dot = dots.get(name);
      dot.classList.toggle('is-active', i === idx);
      dot.classList.toggle('is-done', idx >= 0 && i < idx);
    });
  };
  render(state.get());
  const unsubscribe = state.subscribe(render);
  return { element: wrap, destroy: () => { unsubscribe(); wrap.remove(); } };
}
