(() => {
  const g = document.querySelector('[data-gallery]');
  if (!g) return;
  const slides = Array.from(g.querySelectorAll('[data-slide]'));
  const next = g.querySelector('[data-next]');
  const count = g.querySelector('[data-count]');
  let i = 0;
  const show = n => {
    slides[i].hidden = true;
    i = (n + slides.length) % slides.length;
    slides[i].hidden = false;
    if (count) count.textContent = `${i + 1} / ${slides.length}`;
  };
  show(0);
  if (slides.length < 2) { next.hidden = true; return; }
  next.addEventListener('click', () => show(i + 1));
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
  let x0 = null;
  g.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  g.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
