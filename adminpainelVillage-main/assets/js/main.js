// JS principal: interações de navegação, calendário, carrosséis, vídeo e FAQ

// Utilidades
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const initNav = () => {
  const btn = qs('.nav-toggle');
  const menu = qs('.site-nav .menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
};

const initCalendar = () => {
  const lockRoot = qs('.agenda');
  if (lockRoot && (lockRoot.dataset.month || lockRoot.dataset.year)) {
    return; // agenda possui JS próprio da seção
  }
  const grid = qs('.calendar__grid');
  const title = qs('#calTitle');
  const prev = qs('.calendar .prev');
  const next = qs('.calendar .next');
  if (!grid || !title || !prev || !next) return;

  const state = {
    date: new Date(),
    soldoutDays: [5, 12, 18, 25], // Exemplo de dias esgotados (ajuste conforme necessário)
    availableDays: [1, 3, 7, 9, 14, 20, 22, 28], // Exemplos
  };

  const render = () => {
    const year = state.date.getFullYear();
    const month = state.date.getMonth(); // 0-11
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    title.textContent = `${start.toLocaleString('pt-BR', { month: 'long' })} de ${year}`;

    grid.innerHTML = '';
    // Cabeçalhos dos dias da semana
    ['D','S','T','Q','Q','S','S'].forEach(d => {
      const h = document.createElement('div');
      h.textContent = d;
      h.style.fontWeight = '700';
      h.style.textAlign = 'center';
      grid.appendChild(h);
    });

    // Preenchimento inicial
    for (let i = 0; i < start.getDay(); i++) {
      const pad = document.createElement('div');
      grid.appendChild(pad);
    }

    // Dias do mês
    for (let day = 1; day <= end.getDate(); day++) {
      const el = document.createElement('button');
      el.className = 'day';
      el.textContent = String(day);
      el.setAttribute('aria-label', `Selecionar dia ${day}`);

      if (state.soldoutDays.includes(day)) {
        el.classList.add('day--soldout');
        el.disabled = true;
        el.setAttribute('aria-disabled', 'true');
      } else if (state.availableDays.includes(day)) {
        el.classList.add('day--available');
      }

      el.addEventListener('click', () => {
        qsa('.calendar__grid .day.is-selected').forEach(d => d.classList.remove('is-selected'));
        el.classList.add('is-selected');
      });

      grid.appendChild(el);
    }
  };

  render();
  prev.addEventListener('click', () => {
    state.date.setMonth(state.date.getMonth() - 1);
    render();
  });
  next.addEventListener('click', () => {
    state.date.setMonth(state.date.getMonth() + 1);
    render();
  });
};

const initCarousels = () => {
  const initCarousel = (root) => {
    if (!root) return;
    const track = qs('.carousel__track', root);
    const prev = qs('.carousel__control.prev', root);
    const next = qs('.carousel__control.next', root);
    if (!track || !prev || !next) return;

    const slideW = () => track.firstElementChild?.getBoundingClientRect().width || 300;
    prev.addEventListener('click', () => track.scrollBy({ left: -slideW(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: +slideW(), behavior: 'smooth' }));
  };

  qsa('.carousel').forEach(initCarousel);
};

const initGallery = () => {
  const gallery = qs('.gallery__main');
  if (!gallery) return;
  const img = qs('img', gallery);
  const prev = qs('.gallery__arrow.prev', gallery);
  const next = qs('.gallery__arrow.next', gallery);

  const images = [
    'assets/img/galeria-main.svg',
    'assets/img/galeria-main-2.svg',
    'assets/img/galeria-main-3.svg'
  ];
  let idx = 0;
  const show = () => { img.src = images[idx]; };
  show();

  prev.addEventListener('click', () => { idx = (idx - 1 + images.length) % images.length; show(); });
  next.addEventListener('click', () => { idx = (idx + 1) % images.length; show(); });
};

const initModal = () => {
  const openBtn = qs('.video-card .play-btn');
  const modal = qs('#videoModal');
  const frame = qs('#modalFrame');
  const overlayClose = qsa('[data-close-modal]');
  if (!openBtn || !modal || !frame) return;

  const open = () => {
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    // Iframe inserido dinamicamente
    frame.innerHTML = `
      <iframe width="100%" height="480" src="https://youtu.be/cxpQwpQP2cM"
        title="Village Retrô vídeo" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen></iframe>`;
  };
  const close = () => {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-open');
    frame.innerHTML = '';
  };

  openBtn.addEventListener('click', open);
  overlayClose.forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
};

const initFAQ = () => {
  qsa('.accordion__item').forEach(item => {
    const btn = qs('.accordion__trigger', item);
    const panel = qs('.accordion__panel', item);
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.classList.toggle('is-open', !open);
    });
  });
};

const initAgendaAnchor = () => {
  const scrollToAgendaTitle = (behavior = 'smooth') => {
    const target = document.getElementById('agendaTitle');
    if (!target) return;

    const topbar = document.querySelector('.countdown-bar');
    const header = document.querySelector('.site-header');
    const offset = (topbar?.getBoundingClientRect().height || 0) + (header?.getBoundingClientRect().height || 0) + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior });
  };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#agendaTitle"]');
    if (!link) return;
    e.preventDefault();
    scrollToAgendaTitle('smooth');
    history.pushState(null, '', '#agendaTitle');
  });

  if (window.location.hash === '#agendaTitle') {
    setTimeout(() => scrollToAgendaTitle('auto'), 0);
  }
};

(() => {
  const style = document.createElement('style');
  style.textContent = `
    .modal { position: fixed; inset: 0; display: none; z-index: 50; }
    .modal.is-open { display: grid; place-items: center; }
    .modal__overlay { position: absolute; inset: 0; background: rgba(0,0,0,.65); }
    .modal__content { position: relative; width: min(920px, 92vw); background: #0f0f10; border-radius: 16px; border: 1px solid #ffffff22; }
    .modal__close { position: absolute; top: 10px; right: 10px; border: none; background: var(--pink); color: #fff; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; }
    .modal__frame { padding: 16px; }
  `;
  document.head.appendChild(style);
})();

const initAll = () => {
  initNav();
  initCalendar();
  initCarousels();
  initGallery();
  initModal();
  initFAQ();
  initAgendaAnchor();
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  document.addEventListener('sections:ready', initAll, { once: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('sections:ready', initAll, { once: true });
  });
}
