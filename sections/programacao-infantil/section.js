(() => {
  const root = document.getElementById('programacao-infantil');
  if (!root) return;

  const track = root.querySelector('.kids-program__track');
  const slides = Array.from(root.querySelectorAll('.kids-program__slide'));
  const prevBtn = root.querySelector('.kids-program__nav.prev');
  const nextBtn = root.querySelector('.kids-program__nav.next');
  const dots = Array.from(root.querySelectorAll('.kids-program__dot'));

  let index = 0;

  const setIndex = (next) => {
    if (!track || slides.length === 0) return;
    const total = slides.length;
    index = (next % total + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  };

  if (prevBtn) prevBtn.addEventListener('click', () => setIndex(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setIndex(index + 1));
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.getAttribute('data-index') || '0');
      setIndex(idx);
    });
  });

  setIndex(0);

  const items = Array.from(root.querySelectorAll('.kids-program__item'));
  items.forEach((item) => {
    const btn = item.querySelector('.kids-program__trigger');
    const content = item.querySelector('.kids-program__content');
    const icon = item.querySelector('.kids-program__icon');
    if (!btn || !content || !icon) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      content.hidden = isOpen;
      icon.textContent = isOpen ? '+' : '−';
    });
  });
})();
