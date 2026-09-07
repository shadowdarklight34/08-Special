/**
 * One controller owns the flow. Scenes never call each other directly;
 * they ask the manager to go somewhere. That keeps enter/exit symmetrical
 * and guarantees the previous scene is torn down before the next builds —
 * unless the next scene declares `slideOver`, in which case it enters on top
 * of the previous one (which stays visible until covered) and the old scene
 * is torn down afterwards.
 */
export class SceneManager {
  constructor({ state, order = [], app = document.getElementById('app') }) {
    this.state = state;
    this.order = order;
    this.app = app;
    this.scenes = {};
    this.current = null;
    this.currentName = null;
    this.busy = false;
  }

  register(name, scene) {
    this.scenes[name] = scene;
    scene.manager = this;
    return this;
  }

  indexOf(name) { return this.order.indexOf(name); }

  async goTo(name) {
    const next = this.scenes[name];
    if (!next) throw new Error(`Unknown scene: ${name}`);
    if (name === this.currentName) return;
    if (this.busy) { this.pending = name; return; }   // remember the request, honour it after this transition
    this.busy = true;
    const prev = this.current;
    try {
      if (prev && next.slideOver) {
        prev.deactivate();
        this._activate(next, name);
        await next.enter();
        await prev.exit({ instant: true });
      } else {
        if (prev) await prev.exit();
        this._activate(next, name);
        await next.enter();
      }
    } catch (err) {
      console.error(`[SceneManager] failed entering "${name}"`, err);
    } finally {
      this.busy = false;
      const pending = this.pending;
      this.pending = null;
      if (pending && pending !== this.currentName) this.goTo(pending);
    }
  }

  _activate(scene, name) {
    this.current = scene;
    this.currentName = name;
    if (this.app) this.app.dataset.theme = scene.theme || 'dark';
    this.state.set({ currentScene: name });
    try { history.replaceState(null, '', `#${name}`); } catch { /* file:// etc. */ }
  }

  async next() {
    const i = this.indexOf(this.currentName);
    const name = this.order[i + 1];
    if (name) await this.goTo(name);
  }

  async prev() {
    const i = this.indexOf(this.currentName);
    const name = this.order[i - 1];
    if (name) await this.goTo(name);
  }
}
