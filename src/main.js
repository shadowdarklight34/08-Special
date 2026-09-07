import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/responsive.css';
import './styles/scenes/loading.css';
import './styles/scenes/countdown.css';
import './styles/scenes/birthday.css';
import './styles/scenes/hero.css';
import './styles/scenes/memory.css';
import './styles/scenes/scrapbook.css';
import './styles/scenes/final.css';

import { birthdayConfig as config } from './config/birthday.js';
import { AppState } from './core/AppState.js';
import { SceneManager } from './core/SceneManager.js';
import { AudioManager } from './core/AudioManager.js';
import { PhotoModal } from './components/PhotoModal.js';
import { mountMusicButton } from './components/MusicButton.js';
import { mountProgressIndicator } from './components/ProgressIndicator.js';
import { deviceTier, prefersReducedMotion } from './utils/device.js';
import { asset } from './utils/dom.js';
import gsap from 'gsap';

import { LoadingScene } from './scenes/LoadingScene.js';
import { CountdownScene } from './scenes/CountdownScene.js';
import { BirthdayScene } from './scenes/BirthdayScene.js';
import { HeroScene } from './scenes/HeroScene.js';
import { MemoryScene } from './scenes/MemoryScene.js';
import { ScrapbookScene } from './scenes/ScrapbookScene.js';
import { FinalScene } from './scenes/FinalScene.js';

/** The story, in order. */
const ORDER = ['loading', 'countdown', 'birthday', 'hero', 'memory', 'scrapbook', 'final'];

const tier = deviceTier();
const state = new AppState({
  tier,
  isMobile: tier === 'mobile',
  reducedMotion: config.respectReducedMotion && prefersReducedMotion(),
  musicEnabled: config.music.enabled,
});

const audio = new AudioManager({
  source: asset(config.music.source),
  playlist: config.music.playlist?.map((t) => ({ ...t, source: asset(t.source) })),
  volume: config.music.volume,
  enabled: config.music.enabled,
  state,
});

const modal = new PhotoModal({ audio, reducedMotion: () => state.get().reducedMotion });

const ctx = { state, audio, config, modal };
const manager = new SceneManager({ state, order: ORDER });
manager
  .register('loading', new LoadingScene(ctx))
  .register('countdown', new CountdownScene(ctx))
  .register('birthday', new BirthdayScene(ctx))
  .register('hero', new HeroScene(ctx))
  .register('memory', new MemoryScene(ctx))
  .register('scrapbook', new ScrapbookScene(ctx))
  .register('final', new FinalScene(ctx));

mountMusicButton(document.getElementById('music-button-mount'), audio);
mountProgressIndicator(document.getElementById('progress-indicator-mount'), { order: ORDER, state });

// Keep device facts fresh (rotation, window resize, OS motion preference).
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const t = deviceTier();
    state.set({ tier: t, isMobile: t === 'mobile' });
  }, 150);
});
const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
if (motionQuery?.addEventListener) {
  motionQuery.addEventListener('change', (e) => state.set({ reducedMotion: config.respectReducedMotion && e.matches }));
} else if (motionQuery?.addListener) {
  motionQuery.addListener((e) => state.set({ reducedMotion: config.respectReducedMotion && e.matches }));
}

manager.goTo('loading');

if (import.meta.env.DEV) {
  // Handy in the console: __birthday.manager.goTo('scrapbook')
  window.__birthday = { manager, state, audio, config, gsap };
}
