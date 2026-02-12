(function() {
  const track = document.querySelector('.photo-carousel__track');
  const trackContainer = document.querySelector('.photo-carousel__track-container');
  const nextButton = document.querySelector('.photo-carousel__btn--next');
  const prevButton = document.querySelector('.photo-carousel__btn--prev');

  if (!track || !trackContainer) return;

  // Lista de imagens
  const originalImages = [
    'assets/img/Imagens Village/village01.png',
    'assets/img/Imagens Village/village02.png',
    'assets/img/Imagens Village/village03.png',
    'assets/img/Imagens Village/village04.png',
    'assets/img/Imagens Village/village05.png',
    'assets/img/Imagens Village/village06.png',
    'assets/img/Imagens Village/village07.png',
    'assets/img/Imagens Village/village08.png',
    'assets/img/Imagens Village/village09.png',
    'assets/img/Imagens Village/village10.png',
    'assets/img/Imagens Village/village11.png',
    'assets/img/Imagens Village/village12.png'
  ];

  // Configuração
  const clonesCount = 4; // Aumentar clones para garantir fluidez em telas largas
  let slides = [];
  let currentIndex = clonesCount; // Começa no primeiro slide real
  let isTransitioning = false;
  let interval;
  const transitionDuration = 500; // ms
  const mq = window.matchMedia('(max-width: 768px)');

  // Função auxiliar para criar slide
  const createSlide = (src, index, type = 'real') => {
    const slide = document.createElement('div');
    slide.classList.add('photo-carousel__slide');
    slide.dataset.index = index;
    slide.dataset.type = type;
    
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Foto do Village Retrô';
    img.loading = 'lazy';
    slide.appendChild(img);
    return slide;
  };

  // Montar carrossel com clones
  const setupCarousel = () => {
    // Clones do final para o início
    const endClones = originalImages.slice(-clonesCount).map((src, i) => 
      createSlide(src, originalImages.length - clonesCount + i, 'clone-end')
    );
    // Clones do início para o final
    const startClones = originalImages.slice(0, clonesCount).map((src, i) => 
      createSlide(src, i, 'clone-start')
    );
    // Slides reais
    const realSlides = originalImages.map((src, i) => createSlide(src, i, 'real'));

    // Inserir no DOM
    track.innerHTML = '';
    [...endClones, ...realSlides, ...startClones].forEach(slide => track.appendChild(slide));
    
    slides = Array.from(track.children);
    
    // Forçar layout inicial
    requestAnimationFrame(() => {
      updateCarousel(false);
      // Pequeno delay para garantir que classes CSS sejam aplicadas antes de iniciar transições
      setTimeout(() => {
        slides[currentIndex].classList.add('active');
      }, 50);
    });
  };

  const getSlidePosition = (index) => {
    const slide = slides[index];
    if (!slide) return 0;

    const slideRect = slide.getBoundingClientRect();
    const containerRect = trackContainer.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    // Centro do container
    const containerCenter = containerRect.width / 2;
    
    // Centro do slide relativo ao track
    // offsetLeft é relativo ao pai (track)
    // Precisamos considerar margens? offsetLeft inclui margem esquerda se o pai tiver padding,
    // mas aqui slides têm margem. offsetLeft pega a borda esquerda do elemento.
    // Width inclui padding e border.
    
    const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
    
    // Queremos que slideCenter fique em containerCenter
    // Posição do track (translateX) + slideCenter = containerCenter
    // translateX = containerCenter - slideCenter
    
    return containerCenter - slideCenter;
  };

  const updateCarousel = (animate = true) => {
    if (slides.length === 0) return;

    const translateX = getSlidePosition(currentIndex);

    track.style.transition = animate ? `transform ${transitionDuration}ms cubic-bezier(0.25, 1, 0.5, 1)` : 'none';
    track.style.transform = `translateX(${translateX}px)`;

    // Atualizar classes active
    slides.forEach(s => s.classList.remove('active'));
    if (slides[currentIndex]) {
      slides[currentIndex].classList.add('active');
    }
  };

  const jumpTo = (index) => {
    isTransitioning = true; // Bloqueia inputs durante o pulo silencioso
    currentIndex = index;
    track.style.transition = 'none';
    const translateX = getSlidePosition(currentIndex);
    track.style.transform = `translateX(${translateX}px)`;
    
    // Forçar reflow para garantir que a remoção da transição seja processada
    track.offsetHeight; 
    
    slides.forEach(s => s.classList.remove('active'));
    slides[currentIndex].classList.add('active');
    
    // Liberar flag no próximo frame
    requestAnimationFrame(() => {
      isTransitioning = false;
    });
  };

  const handleTransitionEnd = (e) => {
    if (e.target !== track) return;
    isTransitioning = false;
    
    const realCount = originalImages.length;
    
    // Lógica de loop infinito
    // Se estivermos nos clones do início (índices 0 a clonesCount-1)
    if (currentIndex < clonesCount) {
      // Pular para o correspondente real no final
      // Ex: currentIndex = clonesCount - 1 (último clone do início, que é cópia do último slide real)
      // Deve ir para: clonesCount + realCount - 1
      const newIndex = currentIndex + realCount;
      jumpTo(newIndex);
    } 
    // Se estivermos nos clones do fim (índices clonesCount + realCount em diante)
    else if (currentIndex >= clonesCount + realCount) {
      // Pular para o correspondente real no início
      // Ex: currentIndex = clonesCount + realCount (primeiro clone do fim, cópia do primeiro slide real)
      // Deve ir para: clonesCount
      const newIndex = currentIndex - realCount;
      jumpTo(newIndex);
    }
  };

  const nextSlide = () => {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex++;
    updateCarousel(true);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex--;
    updateCarousel(true);
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    interval = setInterval(nextSlide, 3000);
  };

  const stopAutoScroll = () => {
    clearInterval(interval);
  };

  // Inicialização
  setupCarousel();
  
  track.addEventListener('transitionend', handleTransitionEnd);

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      stopAutoScroll();
      nextSlide();
      startAutoScroll();
    });
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      stopAutoScroll();
      prevSlide();
      startAutoScroll();
    });
  }

  // Pausar no hover
  trackContainer.addEventListener('mouseenter', stopAutoScroll);
  trackContainer.addEventListener('mouseleave', startAutoScroll);

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

  trackContainer.addEventListener('pointerdown', (e) => {
    if (!mq.matches || e.pointerType === 'mouse' || isTransitioning) return;
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.startTranslate = getTranslateX();
    drag.horizontal = false;
    stopAutoScroll();
    track.style.transition = 'none';
    if (trackContainer.setPointerCapture) trackContainer.setPointerCapture(e.pointerId);
  }, { passive: true });

  trackContainer.addEventListener('pointermove', (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId || !mq.matches) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.horizontal) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.active = false;
        track.style.transition = '';
        startAutoScroll();
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
    const threshold = Math.min(90, trackContainer.clientWidth * 0.18);

    if (Math.abs(dx) > threshold) {
      if (dx < 0) nextSlide();
      else prevSlide();
    } else {
      updateCarousel(true);
    }

    startAutoScroll();
  };

  trackContainer.addEventListener('pointerup', endDrag, { passive: true });
  trackContainer.addEventListener('pointercancel', endDrag, { passive: true });

  // Resize handling com debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateCarousel(false);
    }, 100);
  });

  // Iniciar
  startAutoScroll();
})();
