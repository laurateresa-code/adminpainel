(() => {
  const gallerySection = document.getElementById('galeria');
  if (!gallerySection) return;

  const row = gallerySection.querySelector('.gallery__row');
  const prevBtn = gallerySection.querySelector('.gallery__nav.prev');
  const nextBtn = gallerySection.querySelector('.gallery__nav.next');

  if (!row || !prevBtn || !nextBtn) return;

  // Scroll amount: width of one card + gap?
  // Since we set flex: 0 0 100% on mobile, one scroll should be row.clientWidth.
  
  const scrollAmount = () => row.clientWidth;

  prevBtn.addEventListener('click', () => {
    row.scrollBy({
      left: -scrollAmount(),
      behavior: 'smooth'
    });
  });

  nextBtn.addEventListener('click', () => {
    row.scrollBy({
      left: scrollAmount(),
      behavior: 'smooth'
    });
  });

})();
