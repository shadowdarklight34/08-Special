/** Asset preloading with progress. Failures never block the show — a missing photo just shows late. */

export function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve({ src, ok: true });
    img.onerror = () => resolve({ src, ok: false });
    img.src = src;
  });
}

export function preloadAudio(audioEl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!audioEl) return resolve({ ok: false });
    if (audioEl.readyState >= 3) return resolve({ ok: true });
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      audioEl.removeEventListener('canplaythrough', onReady);
      audioEl.removeEventListener('error', onError);
      resolve({ ok });
    };
    const onReady = () => finish(true);
    const onError = () => finish(false);
    audioEl.addEventListener('canplaythrough', onReady);
    audioEl.addEventListener('error', onError);
    setTimeout(() => finish(false), timeoutMs);
    try { audioEl.load(); } catch { finish(false); }
  });
}

/**
 * Preload a set of images (+ optional audio element) and report 0..1 progress.
 * Fonts are awaited too when the Font Loading API exists.
 */
export async function preloadAll({ images = [], audio = null, onProgress = () => {} }) {
  const total = images.length + (audio ? 1 : 0) + 1; // +1 for fonts
  let done = 0;
  const tick = () => onProgress(Math.min(1, done / total));

  const tasks = images.map((src) => preloadImage(src).then((r) => { done++; tick(); return r; }));
  if (audio) tasks.push(preloadAudio(audio).then((r) => { done++; tick(); return r; }));

  const fonts = document.fonts?.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  tasks.push(Promise.race([fonts, new Promise((r) => setTimeout(r, 3000))]).then(() => { done++; tick(); }));

  const results = await Promise.all(tasks);
  return results;
}
