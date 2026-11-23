(() => {
  const root = document.documentElement;
  const today = document.querySelector('[data-today]');
  if (today) {
    const d = new Date();
    today.dateTime = d.toISOString().slice(0, 10);
    today.textContent = d.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/New_York' });
  }
  const button = document.querySelector('[data-appearance-toggle]');
  if (!button) return;
  const label = button.querySelector('[data-appearance-label]');
  const update = () => {
    const dark = root.dataset.theme === 'dark';
    label.textContent = dark ? 'الوضع الفاتح' : 'الوضع الداكن';
    button.setAttribute('aria-label', dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
  };
  update();
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('osama-appearance', root.dataset.theme); } catch (_) {}
    update();
  });
})();
