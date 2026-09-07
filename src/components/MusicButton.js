import { el } from '../utils/dom.js';

const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
const ICON_NEXT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>';
const ICON_PREV = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>';
const ICON_PLAYLIST = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>';
const ICON_VOL_HIGH = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
const ICON_VOL_MUTE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

/**
 * Global music player with floating pill, quick controls, and interactive playlist drawer.
 */
export function mountMusicButton(mount, audio) {
  let isDrawerOpen = false;
  let lastVolume = audio.targetVolume || 0.20;

  // --- Floating Pill ---
  const bars = el('span', { class: 'music-pill__bars', 'aria-hidden': 'true' }, [
    el('i'), el('i'), el('i'), el('i')
  ]);

  const songTitle = el('span', { class: 'music-pill__title', text: audio.currentTrack?.title || 'Music' });
  const songArtist = el('span', { class: 'music-pill__artist', text: audio.currentTrack?.artist ? ` • ${audio.currentTrack.artist}` : '' });
  const pillTrackInfo = el('button', {
    class: 'music-pill__info',
    type: 'button',
    'aria-label': 'Open music playlist',
    title: 'Open playlist & controls',
    onClick: () => toggleDrawer(true),
  }, [songTitle, songArtist]);

  const playBtn = el('button', {
    class: 'music-pill__control play-btn',
    type: 'button',
    'aria-label': 'Play / Pause',
    title: 'Play / Pause',
    html: ICON_PLAY,
    onClick: (e) => {
      e.stopPropagation();
      audio.toggle();
    },
  });

  const nextBtn = el('button', {
    class: 'music-pill__control next-btn',
    type: 'button',
    'aria-label': 'Next song',
    title: 'Next song',
    html: ICON_NEXT,
    onClick: (e) => {
      e.stopPropagation();
      audio.next();
    },
  });

  const playlistToggleBtn = el('button', {
    class: 'music-pill__control playlist-toggle-btn',
    type: 'button',
    'aria-label': 'Music Playlist & Volume',
    title: 'Music Playlist & Volume',
    html: ICON_PLAYLIST,
    onClick: (e) => {
      e.stopPropagation();
      toggleDrawer(!isDrawerOpen);
    },
  });

  const pill = el('div', { class: 'music-pill' }, [
    bars,
    pillTrackInfo,
    playBtn,
    nextBtn,
    playlistToggleBtn,
  ]);

  // --- Drawer Elements ---
  const drawerBackdrop = el('div', {
    class: 'music-drawer__backdrop',
    onClick: () => toggleDrawer(false),
  });

  const drawerTitle = el('h3', { class: 'music-drawer__heading', text: 'Music Playlist 🎵' });
  const drawerSub = el('p', { class: 'music-drawer__sub', text: 'Curated songs just for you ✨' });
  const closeBtn = el('button', {
    class: 'music-drawer__close',
    type: 'button',
    'aria-label': 'Close playlist',
    title: 'Close',
    html: ICON_CLOSE,
    onClick: () => toggleDrawer(false),
  });

  const drawerHeader = el('div', { class: 'music-drawer__header' }, [
    el('div', { class: 'music-drawer__header-text' }, [drawerTitle, drawerSub]),
    closeBtn,
  ]);

  // Volume slider row
  const volIcon = el('button', {
    class: 'music-vol__icon-btn',
    type: 'button',
    'aria-label': 'Toggle mute',
    title: 'Mute / Unmute',
    html: audio.targetVolume > 0 ? ICON_VOL_HIGH : ICON_VOL_MUTE,
    onClick: () => {
      if (audio.targetVolume > 0) {
        lastVolume = audio.targetVolume;
        audio.setVolume(0);
      } else {
        audio.setVolume(lastVolume || 0.20);
      }
    },
  });

  const volSlider = el('input', {
    class: 'music-vol__slider',
    type: 'range',
    min: '0',
    max: '1',
    step: '0.01',
    value: String(audio.targetVolume || 0.20),
    'aria-label': 'Music volume',
    onInput: (e) => {
      const v = parseFloat(e.target.value);
      if (v > 0) lastVolume = v;
      audio.setVolume(v);
    },
  });

  const volPercent = el('span', {
    class: 'music-vol__pct',
    text: `${Math.round((audio.targetVolume || 0.20) * 100)}%`,
  });

  const volRow = el('div', { class: 'music-vol' }, [
    volIcon,
    volSlider,
    volPercent,
  ]);

  // Track list container
  const trackListContainer = el('div', { class: 'music-drawer__tracks' });

  // Drawer footer with Prev / Play / Next
  const drawerPrev = el('button', {
    class: 'music-drawer__ctrl-btn',
    type: 'button',
    title: 'Previous song',
    html: `${ICON_PREV} <span>Prev</span>`,
    onClick: () => audio.prev(),
  });
  const drawerPlay = el('button', {
    class: 'music-drawer__ctrl-btn is-primary',
    type: 'button',
    title: 'Play / Pause',
    html: `${ICON_PLAY} <span>Play</span>`,
    onClick: () => audio.toggle(),
  });
  const drawerNext = el('button', {
    class: 'music-drawer__ctrl-btn',
    type: 'button',
    title: 'Next song',
    html: `<span>Next</span> ${ICON_NEXT}`,
    onClick: () => audio.next(),
  });

  const drawerFooterControls = el('div', { class: 'music-drawer__footer-ctrls' }, [
    drawerPrev,
    drawerPlay,
    drawerNext,
  ]);

  const drawerPanel = el('div', { class: 'music-drawer__panel' }, [
    drawerHeader,
    volRow,
    trackListContainer,
    drawerFooterControls,
  ]);

  const drawerWrapper = el('div', { class: 'music-drawer', hidden: true }, [
    drawerBackdrop,
    drawerPanel,
  ]);

  function toggleDrawer(open) {
    isDrawerOpen = open;
    drawerWrapper.hidden = !open;
    if (open) {
      drawerWrapper.classList.add('is-open');
    } else {
      drawerWrapper.classList.remove('is-open');
    }
  }

  // Keyboard escape
  const onKey = (e) => {
    if (e.key === 'Escape' && isDrawerOpen) toggleDrawer(false);
  };
  document.addEventListener('keydown', onKey);

  // Subscribe to audio updates
  const unsubscribe = audio.subscribe(({ playing, currentTrack, currentIndex, playlist, volume }) => {
    pill.hidden = !audio.enabled;
    pill.classList.toggle('is-playing', playing);

    // Update pill track display
    songTitle.textContent = currentTrack?.title || 'Music';
    songArtist.textContent = currentTrack?.artist ? ` • ${currentTrack.artist}` : '';
    playBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    drawerPlay.innerHTML = playing ? `${ICON_PAUSE} <span>Pause</span>` : `${ICON_PLAY} <span>Play</span>`;

    // Adjust visibility of next/prev if single track
    nextBtn.style.display = playlist.length > 1 ? '' : 'none';
    drawerPrev.style.display = playlist.length > 1 ? '' : 'none';
    drawerNext.style.display = playlist.length > 1 ? '' : 'none';

    // Update volume controls
    volSlider.value = String(volume);
    volPercent.textContent = `${Math.round(volume * 100)}%`;
    volIcon.innerHTML = volume > 0 ? ICON_VOL_HIGH : ICON_VOL_MUTE;

    // Render track items
    trackListContainer.innerHTML = '';
    playlist.forEach((track, idx) => {
      const isCurrent = idx === currentIndex;
      const trackItem = el('button', {
        class: `music-track-item ${isCurrent ? 'is-active' : ''} ${isCurrent && playing ? 'is-playing' : ''}`,
        type: 'button',
        'aria-current': isCurrent ? 'true' : 'false',
        onClick: () => {
          if (isCurrent) {
            audio.toggle();
          } else {
            audio.setTrack(idx, true);
          }
        },
      }, [
        el('div', { class: 'music-track-item__left' }, [
          isCurrent && playing
            ? el('div', { class: 'music-track-item__bars' }, [el('i'), el('i'), el('i')])
            : el('span', { class: 'music-track-item__num', text: String(idx + 1).padStart(2, '0') }),
          el('div', { class: 'music-track-item__details' }, [
            el('span', { class: 'music-track-item__title', text: track.title }),
            el('span', { class: 'music-track-item__artist', text: track.artist }),
          ]),
        ]),
        el('div', { class: 'music-track-item__right' }, [
          isCurrent
            ? el('span', { class: 'music-track-item__badge', text: playing ? 'Playing' : 'Selected' })
            : el('span', { class: 'music-track-item__play-icon', html: ICON_PLAY }),
        ]),
      ]);
      trackListContainer.append(trackItem);
    });
  });

  const container = el('div', { class: 'music-widget' }, [pill, drawerWrapper]);
  mount.append(container);

  return {
    element: container,
    destroy: () => {
      unsubscribe();
      document.removeEventListener('keydown', onKey);
      container.remove();
    },
  };
}
