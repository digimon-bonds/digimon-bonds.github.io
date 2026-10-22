/* Presentation only: no changes to pet needs, activities, saves or habitat. */
(() => {
  const DEFAULT_TIMING = Object.freeze({ interval: [3000, 8000], duration: [120, 180] });

  class PetSpriteController {
    constructor({ element, variants, canBlink = () => true, timing = DEFAULT_TIMING, random = Math.random }) {
      this.element = element;
      // Named asset map can later include happy/sad/tired/sleeping. No rules for them yet.
      this.variants = { ...variants };
      this.normal = variants.normal || element.getAttribute('src');
      this.canBlink = canBlink;
      this.timing = timing;
      this.random = random;
      this.nextTimer = null;
      this.returnTimer = null;
      this.blinkAvailable = false;
      this.preloaded = new Map();
      this.disposed = false;
      this.pageSuspended = false;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.onVisibility = () => this.refresh();
      this.onPageHide = () => { this.pageSuspended = true; this.refresh(); };
      this.onPageShow = () => { this.pageSuspended = false; this.refresh(); };
      this.onError = () => {
        if (this.element.dataset.spriteVariant === 'blink') {
          this.blinkAvailable = false;
          this.cancel();
        }
      };
      document.addEventListener('visibilitychange', this.onVisibility);
      window.addEventListener('pagehide', this.onPageHide);
      window.addEventListener('pageshow', this.onPageShow);
      this.reducedMotion.addEventListener('change', this.onVisibility);
      element.addEventListener('error', this.onError);
      this.show('normal');
      this.ready = Promise.all([this.preload(this.normal), this.preload(variants.blink)])
        .then(([normalReady, blinkReady]) => {
          if (this.disposed) return false;
          this.blinkAvailable = normalReady && blinkReady;
          this.refresh();
          return this.blinkAvailable;
        });
    }

    preload(source) {
      if (!source) return Promise.resolve(false);
      return new Promise(resolve => {
        const image = new Image();
        image.onload = async () => {
          try {
            await image.decode();
            const ready = image.naturalWidth > 0;
            if (ready && !this.disposed) this.preloaded.set(source, image);
            resolve(ready);
          }
          catch { resolve(false); }
        };
        image.onerror = () => resolve(false);
        image.src = source;
      });
    }

    draw([minimum, maximum]) {
      return minimum + Math.floor(this.random() * (maximum - minimum + 1));
    }

    allowed() {
      return !this.disposed && !this.pageSuspended && !document.hidden &&
        !this.reducedMotion.matches && this.blinkAvailable && this.canBlink();
    }

    show(variant) {
      const source = variant === 'blink' ? this.variants.blink : this.normal;
      if (!source) return;
      this.element.dataset.spriteVariant = variant;
      if (this.element.getAttribute('src') !== source) this.element.src = source;
    }

    schedule() {
      if (!this.allowed() || this.nextTimer !== null) return;
      this.nextTimer = setTimeout(() => {
        this.nextTimer = null;
        if (!this.allowed()) { this.cancel(); return; }
        this.show('blink');
        this.returnTimer = setTimeout(() => {
          this.returnTimer = null;
          this.show('normal');
        }, this.draw(this.timing.duration));
        // Start-to-start intervals stay within 3–8 seconds, independently of blink duration.
        this.schedule();
      }, this.draw(this.timing.interval));
    }

    cancel() {
      clearTimeout(this.nextTimer);
      clearTimeout(this.returnTimer);
      this.nextTimer = null;
      this.returnTimer = null;
      this.show('normal');
    }

    refresh() {
      if (!this.allowed()) this.cancel();
      else this.schedule();
    }

    destroy() {
      this.disposed = true;
      this.cancel();
      document.removeEventListener('visibilitychange', this.onVisibility);
      window.removeEventListener('pagehide', this.onPageHide);
      window.removeEventListener('pageshow', this.onPageShow);
      this.reducedMotion.removeEventListener('change', this.onVisibility);
      this.element.removeEventListener('error', this.onError);
      this.preloaded.clear();
    }
  }

  globalThis.PetSprites = { create: options => new PetSpriteController(options), DEFAULT_TIMING };
})();
