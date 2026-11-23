(() => {
  const root = document.documentElement;
  const button = document.querySelector('[data-appearance-toggle]');
  if (!button) return;
  const label = button.querySelector('[data-appearance-label]');
  function updateLabel() {
    const isDark = root.dataset.theme === 'dark';
    label.textContent = isDark ? 'الوضع الفاتح' : 'الوضع الداكن';
    button.setAttribute('aria-label', isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
  }
  updateLabel();
  button.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    try { localStorage.setItem('osama-appearance', theme); } catch (_) {}
    updateLabel();
  });
})();
