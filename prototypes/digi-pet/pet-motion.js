/* Tiny idle movement on a wrapper, independent of sprite choice and game rules. */
(() => {
  const DEFAULTS = Object.freeze({ breathMs: [2400, 3400], touchMs: 320 });
  class PetMotionController {
    constructor({ breathElement, touchElement, canAnimate = () => true, random = Math.random, settings = DEFAULTS }) {
      Object.assign(this, { breathElement, touchElement, canAnimate, random, settings });
      this.breathAnimation = null;
      this.touchAnimation = null;
      this.disposed = false;
      this.suspended = false;
      this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.onChange = () => this.refresh();
      this.onHide = () => { this.suspended = true; this.refresh(); };
      this.onShow = () => { this.suspended = false; this.refresh(); };
      document.addEventListener('visibilitychange', this.onChange);
      this.media.addEventListener('change', this.onChange);
      window.addEventListener('pagehide', this.onHide);
      window.addEventListener('pageshow', this.onShow);
      this.refresh();
    }
    allowed() {
      return !this.disposed && !this.suspended && !document.hidden && !this.media.matches && this.canAnimate();
    }
    refresh() {
      if (!this.allowed()) { this.cancel(); return; }
      if (this.breathAnimation || typeof this.breathElement.animate !== 'function') return;
      const [min, max] = this.settings.breathMs;
      const duration = min + Math.floor(this.random() * (max - min + 1));
      const animation = this.breathElement.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-1px) scale(1.006, 1.012)', offset: .5 },
        { transform: 'translateY(0) scale(1)' },
      ], { duration, easing: 'ease-in-out', iterations: 1 });
      this.breathAnimation = animation;
      animation.finished.then(() => {
        if (this.breathAnimation !== animation) return;
        this.breathAnimation = null;
        this.refresh(); // Draw a new duration only at a cycle boundary: no phase jump.
      }).catch(() => {});
    }
    react() {
      if (!this.allowed() || typeof this.touchElement.animate !== 'function') return false;
      this.touchAnimation?.cancel();
      const animation = this.touchElement.animate([
        { transform: 'rotate(0deg) translateY(0)' },
        { transform: 'rotate(-1deg) translateY(-1px)', offset: .45 },
        { transform: 'rotate(0deg) translateY(0)' },
      ], { duration: this.settings.touchMs, easing: 'ease-in-out', iterations: 1 });
      this.touchAnimation = animation;
      animation.finished.then(() => { if (this.touchAnimation === animation) this.touchAnimation = null; }).catch(() => {});
      return true;
    }
    cancel() {
      this.breathAnimation?.cancel(); this.touchAnimation?.cancel();
      this.breathAnimation = null; this.touchAnimation = null;
    }
    destroy() {
      this.disposed = true; this.cancel();
      document.removeEventListener('visibilitychange', this.onChange);
      this.media.removeEventListener('change', this.onChange);
      window.removeEventListener('pagehide', this.onHide);
      window.removeEventListener('pageshow', this.onShow);
    }
  }
  globalThis.PetMotion = { create: options => new PetMotionController(options), DEFAULTS };
})();
