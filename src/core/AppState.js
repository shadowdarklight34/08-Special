/** Minimal observable state. One source of truth for cross-scene facts. */
export class AppState {
  constructor(initial = {}) {
    this._state = {
      currentScene: null,
      assetsLoaded: false,
      musicEnabled: true,
      musicStarted: false,
      musicPlaying: false,
      countdownComplete: false,
      currentPhoto: 0,
      currentPage: 0,
      isMobile: false,
      tier: 'desktop',
      reducedMotion: false,
      ...initial,
    };
    this._listeners = new Set();
  }

  get() { return this._state; }

  set(partial) {
    const prev = this._state;
    const next = { ...prev, ...partial };
    const changed = Object.keys(partial).filter((k) => prev[k] !== next[k]);
    if (!changed.length) return;
    this._state = next;
    for (const fn of this._listeners) fn(next, changed, prev);
  }

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
}
