import gsap from 'gsap';
import { el, asset } from '../utils/dom.js';

/**
 * One reusable modal for the whole app. Expands from the clicked element (FLIP)
 * and shrinks back on close. Closes on backdrop click, ✕ button or Escape.
 */
export class PhotoModal {
  constructor({ root = document.getElementById('modal-root'), audio = null, reducedMotion = () => false } = {}) {
    this.root = root;
    this.audio = audio;
    this.reducedMotion = reducedMotion;
    this.isOpen = false;
    this._nodes = null;
    this._from = null;
    this._returnFocus = null;
    this._onKey = (e) => { if (e.key === 'Escape') this.close(); };
  }

  open({ src, alt = '', caption = '', fromEl = null }) {
    if (this.isOpen) return;
    this.isOpen = true;
    this._from = fromEl;
    this._returnFocus = document.activeElement;

    const img = el('img', { class: 'photo-modal__img', src: asset(src), alt, draggable: 'false' });
    const cap = el('figcaption', { class: 'photo-modal__caption', text: caption });
    const close = el('button', { class: 'photo-modal__close', type: 'button', 'aria-label': 'Close photo', html: '&times;', onClick: () => this.close() });
    const figure = el('figure', { class: 'photo-modal__figure' }, [img, caption ? cap : null, close]);
    const backdrop = el('div', { class: 'photo-modal__backdrop', onClick: () => this.close() });
    const modal = el('div', { class: 'photo-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': caption || alt || 'Photo' }, [backdrop, figure]);
    this._nodes = { modal, backdrop, figure, img, cap, close };
    this.root.append(modal);
    document.addEventListener('keydown', this._onKey);
    this.audio?.duck(true);

    const animate = () => {
      const reduced = this.reducedMotion();
      gsap.set(backdrop, { opacity: 0 });
      gsap.to(backdrop, { opacity: 1, duration: reduced ? 0.2 : 0.4 });
      if (caption) gsap.set(cap, { opacity: 0 });
      if (fromEl && !reduced) {
        const src = (fromEl.querySelector('img') || fromEl).getBoundingClientRect();
        const dst = figure.getBoundingClientRect();
        gsap.fromTo(figure,
          { x: src.left - dst.left, y: src.top - dst.top, scaleX: src.width / dst.width, scaleY: src.height / dst.height, transformOrigin: 'top left', opacity: 0.6 },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.55, ease: 'power3.out' });
      } else {
        gsap.fromTo(figure, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: reduced ? 0.2 : 0.4, ease: 'power2.out' });
      }
      if (caption) gsap.to(cap, { opacity: 1, duration: 0.4, delay: 0.35 });
      close.focus({ preventScroll: true });
    };
    // Wait for the image to be decoded so the FLIP measures the real size.
    if (img.complete) animate();
    else { img.addEventListener('load', animate, { once: true }); img.addEventListener('error', animate, { once: true }); }
  }

  close() {
    if (!this.isOpen || !this._nodes) return;
    this.isOpen = false;
    const { modal, backdrop, figure, cap } = this._nodes;
    const fromEl = this._from;
    document.removeEventListener('keydown', this._onKey);
    this.audio?.duck(false);
    const reduced = this.reducedMotion();

    const tl = gsap.timeline({ onComplete: () => { modal.remove(); this._nodes = null; this._from = null; } });
    tl.to(backdrop, { opacity: 0, duration: reduced ? 0.2 : 0.35 }, 0);
    if (cap) tl.to(cap, { opacity: 0, duration: 0.15 }, 0);
    if (fromEl && !reduced && fromEl.isConnected) {
      const src = (fromEl.querySelector('img') || fromEl).getBoundingClientRect();
      const dst = figure.getBoundingClientRect();
      // figure may currently be transformed; measure its untransformed box via offset parent math
      const untransformed = { left: dst.left, top: dst.top, width: dst.width, height: dst.height };
      tl.to(figure, {
        x: src.left - untransformed.left, y: src.top - untransformed.top,
        scaleX: src.width / untransformed.width, scaleY: src.height / untransformed.height,
        opacity: 0.4, transformOrigin: 'top left', duration: 0.4, ease: 'power3.in',
      }, 0);
    } else {
      tl.to(figure, { opacity: 0, scale: 0.94, duration: reduced ? 0.2 : 0.3, ease: 'power2.in' }, 0);
    }
    const focusTarget = this._returnFocus;
    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  }

  destroy() { this.close(); }
}
