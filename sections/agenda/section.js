(() => {
  const root = document.getElementById('agenda');
  if (!root) return;

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Variáveis de estado
  let rangeStart = null;
  let rangeEnd = null;

  // Elementos fixos
  const adultsEl = document.getElementById('qty-adults');
  const kidsEl = document.getElementById('qty-kids');
  const reserveBtn = document.getElementById('reserveBtn');

  // Helpers
  const setReserveEnabled = (enabled) => {
    if (!reserveBtn) return;
    reserveBtn.disabled = false;
    reserveBtn.removeAttribute('disabled');
    reserveBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    reserveBtn.classList.toggle('is-disabled', !enabled);
    reserveBtn.style.display = 'inline-block';
    reserveBtn.style.opacity = '1';
    reserveBtn.style.visibility = 'visible';
  };

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // Função principal de renderização
  const renderCalendar = () => {
    const month = Number(root.dataset.month || 4);
    const year = Number(root.dataset.year || 2026);
    const grid = root.querySelector('.calendar__grid');
    const title = root.querySelector('#calTitle');
    
    if (!grid || !title) return;

    // Resetar seleção ao mudar mês/ano
    rangeStart = null;
    rangeEnd = null;
    setReserveEnabled(false);

    // Título dinâmico
    const monthName = monthNames[month - 1] || "Mês Inválido";
    title.textContent = `${monthName} ${year}`;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    grid.innerHTML = '';

    // Dias vazios no início
    for (let i = 0; i < start.getDay(); i++) {
      const pad = document.createElement('div');
      grid.appendChild(pad);
    }

    // Função interna para renderizar o range visualmente
    const renderRange = () => {
      const allDays = Array.from(grid.querySelectorAll('.day'));
      allDays.forEach(d => d.classList.remove('is-selected','in-range','range-start','range-end'));
      
      if (rangeStart && !rangeEnd) {
        rangeStart.classList.add('is-selected','range-start','range-end');
        setReserveEnabled(true);
        return;
      }
      if (rangeStart && rangeEnd) {
        const s = Number(rangeStart.dataset.day);
        const e = Number(rangeEnd.dataset.day);
        allDays.forEach(d => {
          const val = Number(d.dataset.day);
          if (val >= s && val <= e) {
            d.classList.add('in-range');
            if (val === s) d.classList.add('range-start');
            if (val === e) d.classList.add('range-end');
          }
        });
        setReserveEnabled(true);
        return;
      }
      setReserveEnabled(false);
    };

    // Preencher dias
    for (let day = 1; day <= end.getDate(); day++) {
      const el = document.createElement('button');
      el.className = 'day';
      el.textContent = String(day);
      el.dataset.day = String(day);
      el.setAttribute('aria-label', `Selecionar dia ${day}`);
      el.addEventListener('click', () => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
          rangeStart = el; rangeEnd = null;
        } else {
          const startDay = Number(rangeStart.dataset.day);
          const curr = Number(el.dataset.day);
          if (curr < startDay) {
            rangeEnd = rangeStart;
            rangeStart = el;
          } else {
            rangeEnd = el;
          }
        }
        renderRange();
      });
      grid.appendChild(el);
    }
  };

  // Inicializa
  renderCalendar();

  // Ouve evento para atualizar quando o config mudar
  document.addEventListener('agenda:update', renderCalendar);

  // Eventos de quantidade (Adultos/Crianças)
  root.querySelectorAll('.qty__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      const inc = btn.classList.contains('qty--inc') ? 1 : -1;
      if (target === 'adults') {
        const val = clamp(Number(adultsEl.textContent) + inc, 1, 10);
        adultsEl.textContent = String(val);
      } else if (target === 'kids') {
        const val = clamp(Number(kidsEl.textContent) + inc, 0, 10);
        kidsEl.textContent = String(val);
      }
    });
  });

  // Botão de Reserva
  if (reserveBtn) {
    reserveBtn.addEventListener('click', () => {
      const month = Number(root.dataset.month || 4);
      const year = Number(root.dataset.year || 2026);
      
      const adults = Number(adultsEl.textContent);
      const kids = Number(kidsEl.textContent);
      const startDay = rangeStart ? Number(rangeStart.dataset.day) : null;
      const endDay = rangeEnd ? Number(rangeEnd.dataset.day) : startDay;
      const from = startDay ? new Date(year, month - 1, startDay) : null;
      const to = endDay ? new Date(year, month - 1, endDay) : null;

      if (!from || !to) {
        alert('Selecione pelo menos um dia no calendário (Day Use ou período).');
        return;
      }
      if (adults < 1) {
        alert('É obrigatório pelo menos 1 adulto para confirmar a reserva.');
        return;
      }

      const pad2 = (n) => String(n).padStart(2, '0');
      const formatYmd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

      const checkin = new Date(from);
      const checkout = new Date(to);
      if (formatYmd(checkin) === formatYmd(checkout)) {
        checkout.setDate(checkout.getDate() + 1);
      }

      const url = new URL('https://book.villageresort.com.br/');
      url.searchParams.set('checkin', formatYmd(checkin));
      url.searchParams.set('checkout', formatYmd(checkout));
      url.searchParams.set('adults', String(adults));
      url.searchParams.set('childrenQty', String(kids));

      window.location.assign(url.toString());
    });
  }

})();
