/* BONDS OS v10 BETA — opt-in only; install in the forum JS manager, all pages. */
(function () {
  'use strict';
  var BASE_URL = 'https://digimon-bonds.github.io/forum-skin/';
  var VERSION = '20261012-10-beta1'; // Empty disables cache busting.
  var key = 'bondsos', flag = new URLSearchParams(location.search).get(key);
  var active = flag === '1';
  try {
    if (flag === '0') sessionStorage.removeItem(key);
    else if (active) sessionStorage.setItem(key, '1');
    else active = sessionStorage.getItem(key) === '1';
  } catch (_) { /* Without storage only the explicit URL activates this page. */ }
  if (flag === '0' || !active || document.getElementById('bonds-os-css') || document.getElementById('bonds-os-js')) return;
  var root = document.documentElement, css = document.createElement('link'), js, timer, stopped = false, started = false;
  var suffix = VERSION ? '?v=' + encodeURIComponent(VERSION) : '';
  var base = BASE_URL.replace(/\/?$/, '/');
  css.id = 'bonds-os-css'; css.rel = 'stylesheet'; css.href = base + 'bonds-os.css' + suffix;
  // Synchronous, opt-in critical paint: neutralize legacy frames before the remote CSS arrives.
  // Keep content visible; never hide the body while waiting for the network.
  var early = document.createElement('style'); early.id = 'bonds-os-critical';
  early.textContent = 'html.bonds-os-loading,html.bonds-os-loading body{background:#07141d!important;color:#dcebf0!important}html.bonds-os-loading :is(#wrap,#page-body,#main-content,.headerbar,.post,.postbody,.postprofile,.panel,.forabg,.forumbg){background-color:#0b202b!important;background-image:none!important;border-color:#365767!important}html.bonds-os-loading .postprofile{background:none!important}';
  document.head.appendChild(early); root.classList.add('bonds-os-loading');
  function clearEarly() { root.classList.remove('bonds-os-loading'); early.remove(); }
  function cleanListeners() {
    clearTimeout(timer);
    document.removeEventListener('bonds-os-ready', ready);
    document.removeEventListener('bonds-os-failed', rollback);
    document.removeEventListener('DOMContentLoaded', start);
  }
  function ready() { if (stopped) return; cleanListeners(); clearEarly(); }
  function rollback() {
    if (stopped) return; stopped = true; cleanListeners(); clearEarly();
    root.classList.remove('bonds-os-preview');
    if (document.body) document.body.classList.remove('bonds-os-preview');
    css.remove(); if (js) js.remove();
    try { sessionStorage.removeItem(key); } catch (_) {}
    console.warn('[BONDS OS] Beta indisponível; retornando à aparência original.');
    // A partial DOM enhancement cannot be undone safely by removing CSS alone.
    // Reload the native document once with explicit opt-out; never clone native handlers/forms.
    if (root.dataset.bosInitialized) {
      var nativeURL = new URL(location.href); nativeURL.searchParams.set(key, '0');
      location.replace(nativeURL.href);
    }
  }
  function start() {
    if (stopped || started) return; started = true;
    root.classList.add('bonds-os-preview'); document.body.classList.add('bonds-os-preview');
    js = document.createElement('script'); js.id = 'bonds-os-js'; js.src = base + 'bonds-os.js' + suffix;
    js.onerror = rollback;
    js.onload = function () { if (root.dataset.bosInitialized !== 'ready') rollback(); };
    document.addEventListener('bonds-os-ready', ready, { once: true });
    document.addEventListener('bonds-os-failed', rollback, { once: true });
    timer = setTimeout(rollback, 20000);
    document.head.appendChild(js);
  }
  css.onerror = rollback;
  css.onload = function () {
    if (stopped) return; clearTimeout(timer);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  };
  timer = setTimeout(rollback, 20000);
  document.head.appendChild(css);
}());
