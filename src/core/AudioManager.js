import gsap from 'gsap';

/**
 * Global music control with playlist, volume slider, and smooth transitions.
 * Browsers block autoplay, so `play()` must first be called from a user gesture.
 */
export class AudioManager {
  constructor({ source, playlist, volume = 0.20, enabled = true, state, currentIndex = 0 }) {
    this.enabled = enabled;
    this.targetVolume = volume;
    this.volume = volume;
    this.state = state;
    this.playing = false;
    this._listeners = new Set();
    this._fade = null;
    this._isDucked = false;

    if (Array.isArray(playlist) && playlist.length > 0) {
      this.playlist = playlist;
    } else {
      this.playlist = [{ id: 'track-0', title: 'Music', artist: '', source }];
    }

    this.currentIndex = Math.max(0, Math.min(currentIndex, this.playlist.length - 1));

    this.audio = new Audio();
    this.audio.src = this.currentTrack.source;
    this.audio.loop = this.playlist.length === 1;
    this.audio.preload = 'auto';
    this.audio.volume = 0;
    this.audio.setAttribute('playsinline', '');

    this.audio.addEventListener('play', () => this._set(true));
    this.audio.addEventListener('pause', () => this._set(false));
    this.audio.addEventListener('ended', () => {
      if (this.playlist.length > 1) {
        this.next();
      } else {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }
    });
    this.audio.addEventListener('error', () => {
      console.warn('[AudioManager] could not load music:', this.currentTrack?.source);
      if (this.playlist.length > 1) {
        setTimeout(() => this.next(), 1000);
      } else {
        this.enabled = false;
        this._set(false);
      }
    });

    // Pause politely when the tab is hidden; resume when it comes back if it was playing.
    this._wasPlaying = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._wasPlaying = this.playing;
        if (this.playing) this.audio.pause();
      } else if (this._wasPlaying) {
        this.play();
      }
    });
  }

  get currentTrack() {
    return this.playlist[this.currentIndex] || this.playlist[0];
  }

  _getState() {
    return {
      playing: this.playing,
      currentTrack: this.currentTrack,
      currentIndex: this.currentIndex,
      playlist: this.playlist,
      volume: this.targetVolume,
    };
  }

  _notify() {
    const data = this._getState();
    for (const fn of this._listeners) {
      try {
        fn(data);
      } catch (err) {
        console.error('[AudioManager] listener error:', err);
      }
    }
  }

  _set(playing) {
    this.playing = playing;
    this.state?.set({ musicPlaying: playing });
    this._notify();
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn(this._getState());
    return () => this._listeners.delete(fn);
  }

  async play() {
    if (!this.enabled) return false;
    this._fade?.kill();
    try {
      await this.audio.play();
      const target = this._isDucked ? this.targetVolume * 0.35 : this.targetVolume;
      this._fade = gsap.to(this.audio, {
        volume: target,
        duration: 1.5,
        ease: 'power1.out',
      });
      this.state?.set({ musicStarted: true });
      return true;
    } catch (err) {
      console.warn('[AudioManager] playback blocked:', err?.message);
      this._set(false);
      return false;
    }
  }

  pause() {
    this._fade?.kill();
    this._fade = gsap.to(this.audio, {
      volume: 0,
      duration: 0.5,
      ease: 'power1.in',
      onComplete: () => this.audio.pause(),
    });
  }

  toggle() {
    return this.playing ? this.pause() : this.play();
  }

  async setTrack(index, autoPlay = true) {
    if (index < 0 || index >= this.playlist.length) return;
    if (this.currentIndex === index && this.audio.src.endsWith(this.playlist[index].source)) {
      if (autoPlay && !this.playing) this.play();
      return;
    }

    this._fade?.kill();
    const wasPlaying = this.playing;
    this.currentIndex = index;
    const track = this.currentTrack;

    this.audio.pause();
    this.audio.src = track.source;
    this.audio.currentTime = 0;
    this.audio.volume = 0;
    this._notify();

    if (wasPlaying || autoPlay) {
      try {
        await this.audio.play();
        const target = this._isDucked ? this.targetVolume * 0.35 : this.targetVolume;
        this._fade = gsap.to(this.audio, {
          volume: target,
          duration: 1.2,
          ease: 'power1.out',
        });
        this.state?.set({ musicStarted: true });
        this._set(true);
      } catch (err) {
        console.warn('[AudioManager] failed to play track:', err);
      }
    }
  }

  next() {
    const nextIdx = (this.currentIndex + 1) % this.playlist.length;
    this.setTrack(nextIdx, true);
  }

  prev() {
    const prevIdx = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.setTrack(prevIdx, true);
  }

  setVolume(newVol) {
    const clamped = Math.max(0, Math.min(1, newVol));
    this.targetVolume = clamped;
    this.volume = clamped;
    if (this.playing) {
      this._fade?.kill();
      this.audio.volume = this._isDucked ? clamped * 0.35 : clamped;
    }
    this._notify();
  }

  duck(on) {
    this._isDucked = on;
    this._fade?.kill();
    const target = on ? this.targetVolume * 0.35 : this.targetVolume;
    this._fade = gsap.to(this.audio, { volume: target, duration: 0.4 });
  }
}
