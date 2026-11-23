(() => {
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;

  const slides = Array.from(gallery.querySelectorAll('[data-slide]'));
  const controls = gallery.querySelector('.gallery-controls');
  if (slides.length < 2) {
    controls.hidden = true;
    return;
  }

  const count = controls.querySelector('[data-count]');
  let current = 0;
  function move(step) {
    slides[current].hidden = true;
    current = (current + step + slides.length) % slides.length;
    slides[current].hidden = false;
    count.textContent = `${current + 1} / ${slides.length}`;
  }

  controls.querySelector('[data-previous]').addEventListener('click', () => move(-1));
  controls.querySelector('[data-next]').addEventListener('click', () => move(1));
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? 1 : -1);
  });

  const stage = gallery.querySelector('.gallery-stage');
  let start;
  stage.addEventListener('touchstart', event => {
    start = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { start = null; });
  stage.addEventListener('touchend', event => {
    if (!start) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - start.clientX;
    const dy = end.clientY - start.clientY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
    start = null;
  }, { passive: true });
})();
