'use strict';
(() => {
  try { localStorage.removeItem('weather-outfit-motion'); } catch {}
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function update() {
    document.body.classList.toggle('motion-paused', media.matches);
  }
  media.addEventListener('change', update);
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('page-hidden', document.hidden));
  update();
})();
