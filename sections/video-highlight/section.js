(() => {
  const carousel = document.querySelector('.mini-carousel');
  if (!carousel) return;

  const wrapper = carousel.querySelector('.carousel-track-wrapper');
  const track = carousel.querySelector('.carousel-track');
  const prev = carousel.querySelector('.carousel-nav.prev');
  const next = carousel.querySelector('.carousel-nav.next');
  if (!wrapper || !track || !prev || !next) return;

  const originalSlides = Array.from(track.querySelectorAll('.carousel-slide'));
  if (!originalSlides.length) return;

  const clonesCount = Math.min(2, originalSlides.length);
  const createClone = (slide) => {
    const clone = slide.cloneNode(true);
    clone.dataset.clone = 'true';
    return clone;
  };

  const rebuildTrack = () => {
    track.innerHTML = '';

    const endClones = originalSlides.slice(-clonesCount).map(createClone);
    const startClones = originalSlides.slice(0, clonesCount).map(createClone);

    endClones.forEach((slide) => track.appendChild(slide));
    originalSlides.forEach((slide) => track.appendChild(slide));
    startClones.forEach((slide) => track.appendChild(slide));
  };

  rebuildTrack();

  const slides = Array.from(track.querySelectorAll('.carousel-slide'));
  const realCount = originalSlides.length;
  const firstRealIndex = clonesCount;
  const lastRealIndex = clonesCount + realCount - 1;

  let currentIndex = firstRealIndex;
  let timer;
  const mq = window.matchMedia('(max-width: 768px)');
  let suppressClickUntil = 0;

  const setActive = () => {
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentIndex);
    });
  };

  const centerActive = (animate) => {
    setActive();
    requestAnimationFrame(() => {
      const active = slides[currentIndex];
      if (!active) return;

      const translateX = wrapper.clientWidth / 2 - (active.offsetLeft + active.offsetWidth / 2);
      track.style.transition = animate ? 'transform 500ms ease-out' : 'none';
      track.style.transform = `translateX(${translateX}px)`;
    });
  };

  const normalizeIndexIfClone = () => {
    if (currentIndex > lastRealIndex) {
      currentIndex -= realCount;
      centerActive(false);
      return;
    }

    if (currentIndex < firstRealIndex) {
      currentIndex += realCount;
      centerActive(false);
    }
  };

  const nextSlide = () => {
    currentIndex += 1;
    centerActive(true);
  };

  const prevSlide = () => {
    currentIndex -= 1;
    centerActive(true);
  };

  const startTimer = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(nextSlide, 4500);
  };

  const stopTimer = () => {
    if (timer) clearInterval(timer);
  };

  prev.addEventListener('click', () => {
    prevSlide();
    startTimer();
  });

  next.addEventListener('click', () => {
    nextSlide();
    startTimer();
  });

  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => {
      if (Date.now() < suppressClickUntil) return;
      if (slide.dataset.clone === 'true') {
        const realIndex = (index - firstRealIndex + realCount) % realCount;
        currentIndex = firstRealIndex + realIndex;
      } else {
        currentIndex = index;
      }
      centerActive(true);
      startTimer();
    });
  });

  track.addEventListener('transitionend', () => {
    normalizeIndexIfClone();
  });

  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);

  window.addEventListener('resize', () => {
    centerActive(false);
  });

  const getTranslateX = () => {
    const inline = track.style.transform || '';
    const match = inline.match(/translateX\(([-\d.]+)px\)/);
    if (match) return Number(match[1]);
    const computed = window.getComputedStyle(track).transform;
    if (!computed || computed === 'none') return 0;
    const m = computed.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const parts = m[1].split(',').map((v) => Number(v.trim()));
    return Number.isFinite(parts[4]) ? parts[4] : 0;
  };

  const drag = { active: false, pointerId: null, startX: 0, startY: 0, startTranslate: 0, horizontal: false };

  wrapper.addEventListener('pointerdown', (e) => {
    if (!mq.matches || e.pointerType === 'mouse') return;
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.startTranslate = getTranslateX();
    drag.horizontal = false;
    stopTimer();
    track.style.transition = 'none';
    if (wrapper.setPointerCapture) wrapper.setPointerCapture(e.pointerId);
  }, { passive: true });

  wrapper.addEventListener('pointermove', (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId || !mq.matches) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.horizontal) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.active = false;
        track.style.transition = '';
        startTimer();
        return;
      }
      drag.horizontal = true;
    }

    e.preventDefault();
    track.style.transform = `translateX(${drag.startTranslate + dx}px)`;
  }, { passive: false });

  const endDrag = (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    drag.active = false;
    track.style.transition = '';

    const dx = e.clientX - drag.startX;
    const threshold = Math.min(90, wrapper.clientWidth * 0.18);

    if (Math.abs(dx) > 10) suppressClickUntil = Date.now() + 450;

    if (Math.abs(dx) > threshold) {
      if (dx < 0) nextSlide();
      else prevSlide();
    } else {
      centerActive(true);
    }
    startTimer();
  };

  wrapper.addEventListener('pointerup', endDrag, { passive: true });
  wrapper.addEventListener('pointercancel', endDrag, { passive: true });

  centerActive(false);
  startTimer();
})();

/* --- NEW: Icons Mobile Carousel & Animation --- */
(() => {
  const iconsGrid = document.querySelector('.icons-grid');
  if (!iconsGrid) return;

  // Auto Scroll
  let iconTimer;
  const startIconScroll = () => {
    if (iconTimer) clearInterval(iconTimer);
    
    iconTimer = setInterval(() => {
       // Check if scroll enabled (mainly for mobile)
       if (iconsGrid.scrollWidth <= iconsGrid.clientWidth) return;

       // Calculate scroll amount: item width + gap
       const icon = iconsGrid.querySelector('.icon-badge');
       if (!icon) return;
       
       const itemWidth = icon.offsetWidth;
       // We can just scroll by itemWidth if there's no gap logic in offsetWidth
       // The CSS gap is 15px.
       // However, scrollBy works well.
       
       // Check if at end
       if (iconsGrid.scrollLeft + iconsGrid.clientWidth >= iconsGrid.scrollWidth - 10) {
         iconsGrid.scrollTo({ left: 0, behavior: 'smooth' });
       } else {
         // Scroll to next snap point roughly
         iconsGrid.scrollBy({ left: iconsGrid.clientWidth, behavior: 'smooth' });
       }
    }, 3000);
  };

  // Start logic
  startIconScroll();

  // Click Animation Logic
  const icons = iconsGrid.querySelectorAll('.icon-badge');
  icons.forEach(icon => {
    icon.addEventListener('click', () => {
      // Remove class if exists to restart animation
      icon.classList.remove('shimmer-effect');
      void icon.offsetWidth; // trigger reflow
      icon.classList.add('shimmer-effect');
    });
  });
})();

(() => {
  const mq = window.matchMedia('(max-width: 768px)');
  const root = document.querySelector('.icons-marquee-mobile.mobile-only');
  if (!root) return;
  const content = root.querySelector('.marquee-content');
  if (!content) return;

  let rafId = 0;
  let halfWidth = 0;
  let isPaused = false;
  let resumeTimer = 0;
  let retryTimer = 0;

  const refreshSizes = () => {
    halfWidth = content.scrollWidth / 2;
  };

  const stop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = 0;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = 0;
  };

  const pause = () => {
    isPaused = true;
    if (resumeTimer) clearTimeout(resumeTimer);
  };

  const resume = (delay = 900) => {
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      isPaused = false;
    }, delay);
  };

  const tick = () => {
    if (!mq.matches) {
      stop();
      return;
    }

    if (!halfWidth) {
      refreshSizes();
      retryTimer = setTimeout(() => refreshSizes(), 250);
    }

    if (!isPaused && halfWidth > 0 && root.scrollWidth > root.clientWidth) {
      root.scrollLeft += 1.2;
      if (root.scrollLeft >= halfWidth) root.scrollLeft -= halfWidth;
    }

    rafId = requestAnimationFrame(tick);
  };

  root.addEventListener('pointerdown', pause, { passive: true });
  root.addEventListener('pointerup', () => resume(1100), { passive: true });
  root.addEventListener('pointercancel', () => resume(1100), { passive: true });
  root.addEventListener('touchstart', pause, { passive: true });
  root.addEventListener('touchend', () => resume(1100), { passive: true });
  root.addEventListener('touchcancel', () => resume(1100), { passive: true });

  window.addEventListener('resize', () => {
    if (mq.matches) refreshSizes();
  });

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => refreshSizes());
    ro.observe(content);
  }

  if (mq.addEventListener) {
    mq.addEventListener('change', () => {
      if (mq.matches) {
        refreshSizes();
        if (!rafId) tick();
      } else {
        stop();
      }
    });
  }

  refreshSizes();
  if (mq.matches && !rafId) tick();
})();
