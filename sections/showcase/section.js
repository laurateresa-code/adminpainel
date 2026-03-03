(() => {
  const feedback = document.querySelector('.feedback');
  if (!feedback) return;
  const track = feedback.querySelector('.feedback__track');
  const viewport = feedback.querySelector('.feedback__viewport');
  const dots = [...feedback.querySelectorAll('.feedback__dots .dot')];
  if (!track || !viewport || dots.length === 0) return;

  const slides = [...track.querySelectorAll('.feedback__item')];
  let index = 0;
  const mq = window.matchMedia('(max-width: 768px)');
  const goTo = (i) => {
    index = (i + slides.length) % slides.length;
    const x = index * viewport.clientWidth;
    track.style.transform = `translateX(-${x}px)`;
    dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
  };

  dots.forEach((d, di) => d.addEventListener('click', () => {
    goTo(di);
    resetAuto();
  }));

  let auto = setInterval(() => goTo(index + 1), 5000);
  const resetAuto = () => {
    if (auto) clearInterval(auto);
    auto = setInterval(() => goTo(index + 1), 5000);
  };

  const drag = { active: false, pointerId: null, startX: 0, startY: 0, horizontal: false };

  viewport.addEventListener('pointerdown', (e) => {
    if (!mq.matches || e.pointerType === 'mouse') return;
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.horizontal = false;
    if (auto) clearInterval(auto);
    track.style.transition = 'none';
    if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
  }, { passive: true });

  viewport.addEventListener('pointermove', (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId || !mq.matches) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.horizontal) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.active = false;
        track.style.transition = '';
        resetAuto();
        return;
      }
      drag.horizontal = true;
    }

    e.preventDefault();
    const base = -(index * viewport.clientWidth);
    track.style.transform = `translateX(${base + dx}px)`;
  }, { passive: false });

  const endDrag = (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    drag.active = false;
    track.style.transition = '';

    const dx = e.clientX - drag.startX;
    const threshold = Math.min(90, viewport.clientWidth * 0.2);
    if (Math.abs(dx) > threshold) {
      if (dx < 0) goTo(index + 1);
      else goTo(index - 1);
    } else {
      goTo(index);
    }
    resetAuto();
  };

  viewport.addEventListener('pointerup', endDrag, { passive: true });
  viewport.addEventListener('pointercancel', endDrag, { passive: true });

  window.addEventListener('resize', () => {
    goTo(index);
  });

  goTo(0);
})();
