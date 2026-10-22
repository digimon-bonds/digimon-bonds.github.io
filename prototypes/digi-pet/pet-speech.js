/* Short utterances, long quiet periods, no queue of stale reactions. */
(() => {
  class SpeechController {
    constructor({ element, textElement, library, canSpeak = () => true, now = Date.now,
      settings = { visibleMs: 4500, quietMs: 60000, contextCooldownMs: 180000, actionGapMs: 2000 } }) {
      Object.assign(this, { element, textElement, library, canSpeak, now, settings });
      this.timer = null;
      this.current = null;
      this.lastShown = -Infinity;
      this.lastExplicit = -Infinity;
      this.contextTimes = {};
      this.counts = {};
      this.hide();
    }
    hide() {
      clearTimeout(this.timer);
      this.timer = null;
      this.current = null;
      this.element.hidden = true;
      this.textElement.textContent = '';
    }
    speak(context, explicit = false) {
      const time = this.now(), lines = this.library[context];
      if (!lines?.length || !this.canSpeak()) return false;
      if (explicit && time - this.lastExplicit < this.settings.actionGapMs) return false;
      if (!explicit && (this.current || time - this.lastShown < this.settings.quietMs ||
        time - (this.contextTimes[context] ?? -Infinity) < this.settings.contextCooldownMs)) return false;
      this.hide();
      this.textElement.textContent = lines[(this.counts[context] || 0) % lines.length];
      this.counts[context] = (this.counts[context] || 0) + 1;
      this.element.hidden = false;
      this.current = { context, explicit, until: time + this.settings.visibleMs };
      this.lastShown = time;
      this.contextTimes[context] = time;
      if (explicit) this.lastExplicit = time;
      this.timer = setTimeout(() => this.hide(), this.settings.visibleMs);
      return true;
    }
    observe(context) {
      if (!this.canSpeak()) { this.hide(); return; }
      if (this.current && this.now() >= this.current.until) this.hide();
      // A resolved complaint must disappear even if its display period is unfinished.
      if (this.current && !this.current.explicit && ['dirty', 'hungry', 'tired', 'sad', 'lonely'].includes(this.current.context) && this.current.context !== context) this.hide();
      if (!['dirty', 'hungry', 'tired', 'sad', 'lonely'].includes(context)) return;
      this.speak(context);
    }
    reset() {
      this.hide(); this.lastShown = -Infinity; this.lastExplicit = -Infinity;
      this.contextTimes = {}; this.counts = {};
    }
    destroy() { this.hide(); }
  }
  globalThis.PetSpeech = { create: options => new SpeechController(options) };
})();
