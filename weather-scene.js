'use strict';
(() => {
  try { localStorage.removeItem('weather-outfit-motion'); } catch {}
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function update() {
    document.body.classList.toggle('motion-paused', media.matches);
  }
  media.addEventListener('change', update);
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('page-hidden', document.hidden));
  if ('IntersectionObserver' in window) {
    const stage = document.getElementById('stage');
    if (stage) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (document.body.classList.contains('lab-pause')) return;
        entry.target.classList.toggle('scene-offscreen', !entry.isIntersecting);
      }));
      observer.observe(stage);
    }
  }
  update();
})();
