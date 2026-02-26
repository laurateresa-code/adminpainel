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
  let pixTimer = null;
  let pixExpired = false;
  let pixCopyFeedbackTimer = null;
  let pixEndAt = null;
  let pixKey = '';

  // Elementos fixos
  const adultsEl = document.getElementById('qty-adults');
  const kidsEl = document.getElementById('qty-kids');
  const reserveBtn = document.getElementById('reserveBtn');
  const resultsEl = document.getElementById('availability-results');
  const checkoutPanel = document.getElementById('checkout-panel');
  const checkoutRoomNameEl = document.getElementById('checkout-room-name');
  const checkoutDatesEl = document.getElementById('checkout-dates');
  const checkoutGuestsEl = document.getElementById('checkout-guests');
  const checkoutTotalEl = document.getElementById('checkout-total');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutMessageEl = document.getElementById('checkout-message');
  const checkoutCloseBtn = document.getElementById('checkout-close');

  // Metadados dos Quartos
  const ROOM_METADATA = {
    "STD": {
      name: 'Nenhum',
      maxOccupancy: 0,
      description: '.',
      image: 'https://ik.imagekit.io/villageresort/suites/STDCASAL/1.webp?updatedAt=1752003103692',
      images: [
        'https://ik.imagekit.io/villageresort/suites/STDCASAL/1.webp?updatedAt=1752003103692',
      ],
      features: [
        { name: 'Perfeito para casais', icon: 'heart' },
        { name: 'All Fun Inclusive', icon: 'utensils' },
        { name: 'Ambiente climatizado', icon: 'wind' }
      ]
    },
    "STDCASAL": {
      name: 'Standard Casal',
      maxOccupancy: 2,
      description: 'Quarto aconchegante para casais que desejam conforto, tranquilidade e acesso completo às experiências do resort.',
      image: 'https://ik.imagekit.io/villageresort/suites/STDCASAL/1.webp?updatedAt=1752003103692',
      images: [
        'https://ik.imagekit.io/villageresort/suites/STDCASAL/1.webp?updatedAt=1752003103692',
        'https://ik.imagekit.io/villageresort/suites/STDCASAL/2.webp',
        'https://ik.imagekit.io/villageresort/suites/STDCASAL/5.webp'
      ],
      features: [
        { name: 'Perfeito para casais', icon: 'heart' },
        { name: 'All Fun Inclusive', icon: 'utensils' },
        { name: 'Ambiente climatizado', icon: 'wind' }
      ]
    },
    "STDTRIPLO": {
      name: 'Standard Triplo',
      maxOccupancy: 3,
      description: 'A escolha ideal para pequenas famílias ou grupos, combinando funcionalidade, conforto e excelente custo-benefício.',
      image: 'https://ik.imagekit.io/villageresort/suites/STDTRIPLO/1.webp?updatedAt=1752002724911',
      images: [
        'https://ik.imagekit.io/villageresort/suites/STDTRIPLO/1.webp?updatedAt=1752002724911',
        'https://ik.imagekit.io/villageresort/suites/STDTRIPLO/2.webp',
        'https://ik.imagekit.io/villageresort/suites/STDTRIPLO/3.webp'
      ],
      features: [
        { name: 'Excelente custo-benefício', icon: 'tag' },
        { name: 'Ideal para famílias pequenas', icon: 'users' },
        { name: 'All Fun Inclusive', icon: 'utensils' }
      ]
    },
    "STDFAMILIA": {
      name: 'Standard Família',
      maxOccupancy: 4,
      description: 'Espaço confortável pensado para famílias que querem aproveitar o resort com comodidade e praticidade.',
      image: 'https://ik.imagekit.io/villageresort/suites/STDFAMILIA/1.webp?updatedAt=1752002308170',
      images: [
        'https://ik.imagekit.io/villageresort/suites/STDFAMILIA/1.webp?updatedAt=1752002308170',
        'https://ik.imagekit.io/villageresort/suites/STDFAMILIA/2.webp',
        'https://ik.imagekit.io/villageresort/suites/STDFAMILIA/4.webp',
        'https://ik.imagekit.io/villageresort/suites/STDFAMILIA/3.webp'
      ],
      features: [
        { name: 'Pensado para famílias', icon: 'users' },
        { name: 'Boa distribuição de camas', icon: 'check' },
        { name: 'Ótimo custo-benefício', icon: 'tag' }
      ]
    },
    "MTRFAM04": {
      name: 'Master (04)',
      maxOccupancy: 4,
      description: 'Quarto amplo e funcional, ideal para famílias que valorizam espaço, conforto e acessibilidade.',
      image: 'https://ik.imagekit.io/villageresort/suites/MTRFAM04/1.webp?updatedAt=1752002808500',
      images: [
        'https://ik.imagekit.io/villageresort/suites/MTRFAM04/1.webp'
      ],
      features: [
        { name: 'Ambiente amplo', icon: 'expand' },
        { name: 'Acessibilidade facilitada', icon: 'wheelchair' },
        { name: 'Banheiro adaptado', icon: 'check' }
      ]
    },
    "MTR": {
      name: 'Master (05)',
      maxOccupancy: 5,
      description: 'Mais espaço e conforto para famílias maiores, garantindo bem-estar durante toda a estadia.',
      image: 'https://ik.imagekit.io/villageresort/suites/MTR/4.webp?updatedAt=1752002455784',
      images: [
        'https://ik.imagekit.io/villageresort/suites/MTR/4.webp?updatedAt=1752002455784',
        'https://ik.imagekit.io/villageresort/suites/MTR/1.webp',
        'https://ik.imagekit.io/villageresort/suites/MTR/3.webp',
        'https://ik.imagekit.io/villageresort/suites/MTR/2.webp'
      ],
      features: [
        { name: 'Ideal para famílias grandes', icon: 'users' },
        { name: 'Acessível', icon: 'wheelchair' },
        { name: 'Banheiro adaptado', icon: 'check' }
      ]
    },
    "MTRFAM07": {
      name: 'Master (07)',
      maxOccupancy: 7,
      description: 'Acomodação espaçosa com varanda, perfeita para grandes famílias que desejam conforto e proximidade das áreas de lazer.',
      image: 'https://ik.imagekit.io/villageresort/suites/MTRFAM07/1.webp?updatedAt=1752003757867',
      images: [
        'https://ik.imagekit.io/villageresort/suites/MTRFAM07/1.webp?updatedAt=1752003757867',
        'https://ik.imagekit.io/villageresort/suites/MTRFAM07/2.webp',
        'https://ik.imagekit.io/villageresort/suites/MTRFAM07/3.webp'
      ],
      features: [
        { name: 'Próximo ao espaço kids', icon: 'sparkles' },
        { name: 'Varanda privativa', icon: 'sun' },
        { name: 'Ideal para grandes grupos', icon: 'users' }
      ]
    },
    "PRM": {
      name: 'Premium',
      maxOccupancy: 4,
      description: 'Experiência superior com varanda privativa e vista especial, ideal para quem busca mais conforto e exclusividade.',
      image: 'https://ik.imagekit.io/villageresort/suites/PRM/5.webp?updatedAt=1752002631557',
      images: [
        'https://ik.imagekit.io/villageresort/suites/PRM/5.webp?updatedAt=1752002631557',
        'https://ik.imagekit.io/villageresort/suites/PRM/1.webp',
        'https://ik.imagekit.io/villageresort/suites/PRM/2.webp',
        'https://ik.imagekit.io/villageresort/suites/PRM/3.webp',
        'https://ik.imagekit.io/villageresort/suites/PRM/4.webp',
        'https://ik.imagekit.io/villageresort/suites/PRM/6.webp'
      ],
      features: [
        { name: 'Varanda privativa', icon: 'sun' },
        { name: 'Vista privilegiada', icon: 'sparkles' },
        { name: 'Categoria premium', icon: 'star' }
      ]
    },
    "CLG": {
      name: 'Chalé',
      maxOccupancy: 8,
      description: 'O máximo de conforto e privacidade do Village Resort. Ideal para grandes grupos que desejam exclusividade total.',
      image: 'https://ik.imagekit.io/villageresort/suites/CLG/6.webp?updatedAt=1752002933444',
      images: [
        'https://ik.imagekit.io/villageresort/suites/CLG/6.webp?updatedAt=1752002933444',
        'https://ik.imagekit.io/villageresort/suites/CLG/1.webp',
        'https://ik.imagekit.io/villageresort/suites/CLG/2.webp',
        'https://ik.imagekit.io/villageresort/suites/CLG/3.webp',
        'https://ik.imagekit.io/villageresort/suites/CLG/4.webp',
        'https://ik.imagekit.io/villageresort/suites/CLG/5.webp'
      ],
      features: [
        { name: 'Piscina privativa', icon: 'umbrella' },
        { name: 'Privacidade total', icon: 'lock' },
        { name: 'Ideal para grandes grupos', icon: 'users' }
      ]
    },
  };

  // API Config (Render.com)
  const API_URL = 'https://motor-reservas-new.onrender.com/api/avail/';
  const BOOKING_API_URL = 'https://motor-reservas-new.onrender.com/api/bookings';
  const PAYMENT_API_URL = 'https://motor-reservas-new.onrender.com/api/payment';

  // Estado da última busca e seleção de checkout
  let lastSearchPayload = null;
  let lastRooms = [];
  let selectedRoom = null;
  let lastBookingId = null;

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

  const formatCurrencyBRL = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const setPixTotalValue = (value) => {
    const el = document.getElementById('pix-total-value');
    if (!el) return;
    el.textContent = formatCurrencyBRL(value);
  };

  const formatDateBr = (iso) => {
    if (!iso) return '';
    const [year, month, day] = iso.split('-');
    if (!year || !month || !day) return iso;
    return `${day}/${month}/${year}`;
  };

  const getNightsBetween = (checkin, checkout) => {
    if (!checkin || !checkout) return null;
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const diff = d2 - d1;
    if (!Number.isFinite(diff)) return null;
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

 const updatePaymentCardVisibility = () => {
  const methodInput = checkoutForm
    ? checkoutForm.querySelector('input[name="checkout-payment-method"]:checked')
    : document.querySelector('input[name="checkout-payment-method"]:checked');
  const cardFields = document.getElementById('checkout-card-fields');
  const pixArea = document.getElementById('checkout-pix-area');
  const submitBtn = document.getElementById('checkout-submit-btn');
  const method = methodInput ? methodInput.value : 'pix';

  if (cardFields) cardFields.style.display = method === 'card' ? 'block' : 'none';
  if (pixArea) pixArea.style.display = method === 'pix' ? 'block' : 'none';
  if (submitBtn) submitBtn.textContent = method === 'pix' ? 'Já paguei' : 'Finalizar pagamento';

  if (method !== 'pix' && pixTimer) {
    clearInterval(pixTimer);
    pixTimer = null;
  }

  if (method === 'pix' && selectedRoom) {
    const baseTotal = Number(selectedRoom.totalPrice || 0);
    setPixTotalValue(Number((baseTotal * 0.9).toFixed(2)));
  }
};


  const openCheckoutForRoom = (room) => {
    if (!checkoutPanel || !room || !lastSearchPayload) return;

    const occupation = lastSearchPayload.occupation || lastSearchPayload;
    const checkin = occupation.checkin;
    const checkout = occupation.checkout;
    const nights = getNightsBetween(checkin, checkout);
    const adults = Number(occupation.adults || 0);
    const kids =
      Array.isArray(occupation.children)
        ? occupation.children.length
        : Number(occupation.children || 0);

    const summaryCard = document.getElementById('checkout-summary-card');
    if (summaryCard) {
      const meta = ROOM_METADATA[room.code] || {};
      const hasImage = !!meta.image;
      const checkinBr = formatDateBr(checkin);
      const checkoutBr = formatDateBr(checkout);
      const nightsLabel = nights ? `${nights} noite${nights > 1 ? 's' : ''}` : '';
      const guestsLabel = [adults ? `${adults} adulto${adults > 1 ? 's' : ''}` : '', kids ? `${kids} criança${kids > 1 ? 's' : ''}` : ''].filter(Boolean).join(' • ');
      const totalText = Number(room.totalPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      summaryCard.innerHTML = `
        ${hasImage ? `
          <div class="checkout-summary-card__media">
            <img src="${meta.image}" alt="${meta.name || room.name || room.code}">
          </div>
        ` : `<div class="checkout-summary-card__media" style="background:#e2e8f0;"></div>`}
        <div class="checkout-summary-card__body">
          <div class="checkout-summary-card__title">${meta.name || room.name || room.code}</div>
          <div class="checkout-summary-card__subtitle">All Fun Inclusive</div>
          <div class="checkout-summary-card__row">
            <span class="checkout-chip">${checkinBr} – ${checkoutBr}${nightsLabel ? ` • ${nightsLabel}` : ''}</span>
            ${guestsLabel ? `<span class="checkout-chip">${guestsLabel}</span>` : ''}
            <div class="checkout-summary-card__total">
              <small>TOTAL DA ESTADIA</small>
              <strong>${totalText}</strong>
            </div>
          </div>
        </div>
      `;
    }

    if (checkoutMessageEl) {
      checkoutMessageEl.textContent = '';
      checkoutMessageEl.className = 'checkout-message';
    }

    checkoutPanel.style.display = 'block';
    checkoutPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updatePaymentCardVisibility();
  };

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
      allDays.forEach(d => d.classList.remove('is-selected', 'in-range', 'range-start', 'range-end'));

      if (rangeStart && !rangeEnd) {
        rangeStart.classList.add('is-selected', 'range-start', 'range-end');
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

  // Funções de Disponibilidade Direta
  const fetchAvailability = async (data) => {
    const loader = document.getElementById('availability-loader');
    if (!resultsEl) return;

    lastSearchPayload = data;
    lastRooms = [];
    selectedRoom = null;

    if (checkoutPanel) {
      checkoutPanel.style.display = 'none';
    }

    // Esconde resultados anteriores e mostra o loader animado
    resultsEl.style.display = 'none';
    if (loader) loader.style.display = 'block';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Falha ao consultar disponibilidade');

      const result = await response.json();
      console.log('API Response:', result);

      // Processamento da resposta complexa do PMS
      let processedRooms = [];

      try {
        // Pelo log do console, RoomStays está na RAIZ do objeto result, não dentro de HotelStays
        const roomStaysRoot = result.RoomStays?.RoomStay;
        const roomStay = Array.isArray(roomStaysRoot) ? roomStaysRoot[0] : roomStaysRoot;

        if (roomStay) {
          const roomTypes = roomStay.RoomTypes?.RoomType || [];
          const roomRates = roomStay.RoomRates?.RoomRate || [];

          const roomTypesArray = Array.isArray(roomTypes) ? roomTypes : [roomTypes];
          const roomRatesArray = Array.isArray(roomRates) ? roomRates : [roomRates];

          console.log('Processed RoomTypes:', roomTypesArray);
          console.log('Processed RoomRates:', roomRatesArray);

          processedRooms = roomTypesArray.map((type, index) => {
            const code = type["@_RoomTypeCode"];
            const name = type["@_RoomType"];
            const apiMaxOccupancy = parseInt(type.Occupancy?.["@_MaxOccupancy"] || 0);

            // Busca metadados locais para conferir o maxOccupancy definido na const ROOM_METADATA
            const meta = ROOM_METADATA[code] || {};
            const metaMaxOccupancy = parseInt(meta.maxOccupancy || 999);

            // Total de hóspedes solicitados pelo usuário (vindos dos seletores)
            // Lendo de data.occupation para manter compatibilidade com o formato esperado pelo servidor
            const adultsReq = data.occupation?.adults || data.adults || 0;
            const kidsReq = data.occupation?.children || data.children || 0;
            const totalRequestedGuests = parseInt(adultsReq) + parseInt(kidsReq);

            console.log(`Room ${code}: Req=${totalRequestedGuests}, API_Max=${apiMaxOccupancy}, Meta_Max=${metaMaxOccupancy}`);

            // Tenta encontrar o rate pelo índice
            const rate = roomRatesArray[index];
            let totalPrice = 0;
            let hasUnitsAllDays = false;

            if (rate && rate.Rates?.Rate) {
              const rates = Array.isArray(rate.Rates.Rate) ? rate.Rates.Rate : [rate.Rates.Rate];

              // Verifica se há unidades disponíveis (> 0) em TODOS os dias selecionados
              hasUnitsAllDays = rates.every(r => parseInt(r["@_NumberOfUnits"] || 0) > 0);

              // Soma os preços de todas as diárias do período usando o valor sem impostos (BeforeTax)
              totalPrice = rates.reduce((sum, r) => {
                const amount = parseFloat(r.Base?.["@_AmountBeforeTax"] || 0);
                return sum + amount;
              }, 0);
            }

            return {
              code: code,
              name: name,
              apiMaxOccupancy: apiMaxOccupancy,
              metaMaxOccupancy: metaMaxOccupancy,
              totalRequestedGuests: totalRequestedGuests,
              totalPrice: totalPrice,
              hasUnitsAllDays: hasUnitsAllDays,
              bookingUrl: `https://book.villageresort.com.br/?checkin=${data.occupation?.checkin || data.checkin}&checkout=${data.occupation?.checkout || data.checkout}&adults=${adultsReq}&children=${kidsReq}&roomType=${code}`
            };
          }).filter(room => {
            // SÓ EXIBE SE:
            // 1. Tiver preço
            // 2. O código do quarto NÃO FOR 'STD' (Ignorar Standard simples)
            // 3. A ocupação máxima da API for compatível
            // 4. A ocupação máxima definida no ROOM_METADATA (local) for compatível
            // 5. Tiver unidades disponíveis em TODOS os dias selecionados (@_NumberOfUnits > 0)
            const isNotSTD = room.code !== 'STD';
            const isApiCompatible = room.apiMaxOccupancy >= room.totalRequestedGuests;
            const isMetaCompatible = room.metaMaxOccupancy >= room.totalRequestedGuests;

            const isVisible = room.totalPrice > 0 && isNotSTD && isApiCompatible && isMetaCompatible && room.hasUnitsAllDays;

            if (!isVisible) {
              console.log(`Room ${room.code} filtered out: Price=${room.totalPrice}, NotSTD=${isNotSTD}, API_OK=${isApiCompatible}, Meta_OK=${isMetaCompatible}, Units_OK=${room.hasUnitsAllDays}`);
            }
            return isVisible;
          });
        } else {
          console.warn('Estrutura RoomStay não encontrada na resposta.');
        }
      } catch (processError) {
        console.error('Erro detalhado ao processar dados da API:', processError);
      }

      // Ordena do mais barato para o mais caro
      processedRooms.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));

      lastRooms = processedRooms;

      // Esconde o loader antes de mostrar os resultados
      const loader = document.getElementById('availability-loader');
      if (loader) loader.style.display = 'none';
      resultsEl.style.display = 'block';

      renderRooms(processedRooms);
    } catch (err) {
      console.error('Erro na consulta:', err);
      const loader = document.getElementById('availability-loader');
      if (loader) loader.style.display = 'none';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '<div class="availability-error">Desculpe, ocorreu um erro ao consultar a disponibilidade. Por favor, tente novamente mais tarde.</div>';
    }
  };

  if (checkoutCloseBtn && checkoutPanel) {
    checkoutCloseBtn.addEventListener('click', () => {
      checkoutPanel.style.display = 'none';
    });
  }

  const paymentRadios = checkoutForm
    ? checkoutForm.querySelectorAll('input[name="checkout-payment-method"]')
    : document.querySelectorAll('input[name="checkout-payment-method"]');
  paymentRadios.forEach(r => {
    r.addEventListener('change', updatePaymentCardVisibility);
  });
  updatePaymentCardVisibility();

  const getPixArea = () => document.getElementById('checkout-pix-area');

  // --- PIX: copiar chave com feedback ---
  // Regras:
  // - A chave não aparece na tela (fica apenas em memória)
  // - Usa navigator.clipboard.writeText() quando disponível
  // - Faz fallback via document.execCommand('copy')
  // - Mostra "Chave copiada!" por 2s no botão
  const copyToClipboard = async (text) => {
    const t = (text || '').trim();
    if (!t) return false;

    try {
      await navigator.clipboard.writeText(t);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = t;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const showPixCopiedFeedback = (btn) => {
    if (!btn) return;
    if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent || 'Copiar chave PIX';
    btn.textContent = 'Copiado!';
    btn.classList.add('is-copied');
    if (pixCopyFeedbackTimer) clearTimeout(pixCopyFeedbackTimer);
    pixCopyFeedbackTimer = setTimeout(() => {
      btn.textContent = btn.dataset.originalText || 'Copiar chave PIX';
      btn.classList.remove('is-copied');
      pixCopyFeedbackTimer = null;
    }, 2000);
  };

  const handlePixCopy = async () => {
    if (pixExpired) return;
    const code = (pixKey || '').trim();
    if (!code) return;
    const ok = await copyToClipboard(code);
    if (!ok) return;
    const area = getPixArea();
    const btn = area ? area.querySelector('#copy-pix') : document.getElementById('copy-pix');
    showPixCopiedFeedback(btn);
  };

  const pixCopyBtn = document.getElementById('copy-pix');
  if (pixCopyBtn && pixCopyBtn.dataset.pixBound !== '1') {
    pixCopyBtn.dataset.pixBound = '1';
    pixCopyBtn.addEventListener('click', handlePixCopy);
  }

  const setupCardMirroring = () => {
    const container = document.getElementById('checkout-card-preview');
    const numberInput = document.getElementById('checkout-card-number');
    const holderInput = document.getElementById('checkout-card-holder');
    const expInput = document.getElementById('checkout-card-expiration');
    const cvvInput = document.getElementById('checkout-card-cvv');
    const numberEl = document.getElementById('cc-number');
    const holderEl = document.getElementById('cc-holder');
    const expiryEl = document.getElementById('cc-expiry');
    const cvvEl = document.getElementById('cc-cvv');
    const brandContainer = document.getElementById('cc-brand');
    if (!container) return;
    const digitsOnly = (s) => (s || '').replace(/\D+/g, '');
    const fmtCard = (s) => digitsOnly(s).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const fmtExp = (s) => {
      const d = digitsOnly(s).slice(0, 4);
      let mm = d.slice(0, 2);
      let yy = d.slice(2, 4);

      if (mm.length === 1) {
        const a = Number(mm);
        if (a > 1) mm = `0${a}`;
      }
      if (mm.length === 2) {
        let m = Number(mm);
        if (!Number.isFinite(m)) m = 0;
        if (m === 0) m = 1;
        if (m > 12) m = 12;
        mm = String(m).padStart(2, '0');
      }

      if (yy.length === 2) {
        let y = Number(yy);
        if (!Number.isFinite(y)) y = 0;
        if (y > 31) y = 31;
        yy = String(y).padStart(2, '0');
      }

      if (d.length <= 2) return mm;
      return `${mm}/${yy}`;
    };
    const fmtCVV = (s) => digitsOnly(s).slice(0, 4);
    const detectBrand = (number) => {
      const n = digitsOnly(number);
      const eloBins = [
        /^4011/, /^4312/, /^4389/, /^4514/, /^4573/, /^4576/, /^5041/, /^5067/,
        /^5090/, /^6277/, /^6362/, /^6363/, /^6500/, /^6504/, /^6505/, /^6516/,
        /^6550/
      ];
      if (eloBins.some((bin) => bin.test(n))) return 'elo';
      if (/^(34|37)/.test(n)) return 'amex';
      if (/^(5[1-5])/.test(n) || /^(2221|222[2-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(n)) return 'mastercard';
      if (/^6011/.test(n) || /^65/.test(n) || /^64[4-9]/.test(n)) return 'discover';
      if (/^4/.test(n)) return 'visa';
      return 'default';
    };
    const updateCardBrand = (brand) => {
      if (!brandContainer) return;
      const icons = {
        visa: '<img src="https://logodownload.org/wp-content/uploads/2016/10/visa-logo-1-1.png" width="50">',
        mastercard: '<img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" width="50">',
        amex: '<img src="https://anadef.org.br/wp-content/uploads/2022/04/277580440007211_baaefe070804f03ea4d8f4d1a809a2a1-1.png" width="50">',
        elo: '<img src="https://logodownload.org/wp-content/uploads/2017/04/elo-logo-24.png" width="50">',
        discover: '<img src="https://www.maquinadecartao.com/img/1/discover-logo-bandeira-de-maquininha-de-cartao-david-tech.webp" width="60">',
        default: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><circle cx="16" cy="24" r="14" fill="#d50000"></circle><circle cx="32" cy="24" r="14" fill="#ff9800"></circle><path d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48C20.376,15.05,18,19.245,18,24z" fill="#ff3d00"></path></svg>'
      };
      brandContainer.innerHTML = icons[brand] || icons.default;
    };
    const updateCardColor = (brand) => {
      if (!container) return;
      container.classList.add('pix-credit-card');
      ['visa', 'mastercard', 'amex', 'elo', 'discover', 'default'].forEach((b) => container.classList.remove(`card-${b}`));
      container.classList.add(`card-${brand}`);
    };
    if (numberInput && numberEl) {
      numberInput.addEventListener('input', () => {
        const f = fmtCard(numberInput.value);
        numberInput.value = f;
        numberEl.textContent = f || '0000 0000 0000 0000';
        const brand = detectBrand(f);
        updateCardBrand(brand);
        updateCardColor(brand);
      });
    }
    if (holderInput && holderEl) {
      holderInput.addEventListener('input', () => {
        const v = (holderInput.value || '').trim();
        holderEl.textContent = v ? v.toUpperCase() : 'FULL NAME';
      });
    }
    if (expInput && expiryEl) {
      expInput.addEventListener('input', () => {
        const f = fmtExp(expInput.value);
        expInput.value = f;
        expiryEl.textContent = f || 'MM/AA';
      });
    }
    if (cvvInput && cvvEl) {
      cvvInput.addEventListener('focus', () => {
        container.classList.add('show-back');
      });
      cvvInput.addEventListener('blur', () => {
        container.classList.remove('show-back');
      });
      cvvInput.addEventListener('input', () => {
        const f = fmtCVV(cvvInput.value);
        cvvInput.value = f;
        cvvEl.textContent = f || '000';
      });
    }
  };
  setupCardMirroring();

  const bindCheckoutMasks = () => {
    const digitsOnly = (s) => (s || '').replace(/\D+/g, '');

    const bindMask = (input, format) => {
      if (!input || input.dataset.maskBound === '1') return;
      input.dataset.maskBound = '1';
      input.addEventListener('input', () => {
        const formatted = format(input.value);
        if (input.value !== formatted) input.value = formatted;
      });
    };

    const formatCpf = (value) => {
      let v = digitsOnly(value).slice(0, 11);
      if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
      if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
      if (v.length > 3) return v.replace(/(\d{3})(\d+)/, '$1.$2');
      return v;
    };

    const formatPhone = (value) => {
      const v = digitsOnly(value).slice(0, 11);
      if (v.length <= 2) return v;
      const ddd = v.slice(0, 2);
      const rest = v.slice(2);
      if (rest.length <= 5) return `(${ddd}) ${rest}`;
      if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
      return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    };

    const formatZip = (value) => {
      const v = digitsOnly(value).slice(0, 8);
      if (v.length <= 5) return v;
      return `${v.slice(0, 5)}-${v.slice(5)}`;
    };

    bindMask(document.getElementById('checkout-cpf'), formatCpf);
    bindMask(document.getElementById('checkout-phone'), formatPhone);
    bindMask(document.getElementById('checkout-zip'), formatZip);
  };

  bindCheckoutMasks();

  // --- PIX: countdown funcional (10 minutos) ---
  // Regras:
  // - Contagem regressiva real
  // - Últimos 3 minutos: cor vermelha + pulsar suave
  // - Ao zerar: desabilita copiar e exibe "Tempo expirado. Gere um novo PIX."
  const setPixExpiredUI = (expired) => {
    const hasActivePix = Boolean((pixKey || '').trim());
    pixExpired = Boolean(expired) && hasActivePix;
    const area = getPixArea();
    const expiredEl = area ? area.querySelector('#pix-expired') : document.getElementById('pix-expired');
    const copyBtn = area ? area.querySelector('#copy-pix') : document.getElementById('copy-pix');
    const qrWrap = area ? area.querySelector('.pix-qr-wrap') : null;

    if (expiredEl) expiredEl.hidden = !pixExpired;
    if (copyBtn) copyBtn.disabled = pixExpired || !(pixKey || '').trim();
    if (qrWrap) qrWrap.style.display = pixExpired ? 'none' : 'grid';
  };

  const formatCountdown = (ms) => {
    const safe = Math.max(0, ms);
    const m = String(Math.floor(safe / 60000)).padStart(2, '0');
    const s = String(Math.floor((safe % 60000) / 1000)).padStart(2, '0');
    return `${m}:${s}`;
  };

  function startPixCountdown(ms) {
    const area = getPixArea();
    const el = area ? area.querySelector('#pix-countdown') : document.getElementById('pix-countdown');
    if (!el) return;
    if (pixTimer) { clearInterval(pixTimer); pixTimer = null; }
    setPixExpiredUI(false);
    pixEndAt = Date.now() + ms;
    const tick = () => {
      const diff = Math.max(0, (pixEndAt || 0) - Date.now());
      el.textContent = formatCountdown(diff);
      if (diff > 0 && diff <= 3 * 60 * 1000) {
        el.classList.add('is-urgent');
      } else {
        el.classList.remove('is-urgent');
      }
      if (diff <= 0) {
        clearInterval(pixTimer);
        pixTimer = null;
        el.classList.remove('is-urgent');
        setPixExpiredUI(true);
      }
    };
    tick();
    pixTimer = setInterval(tick, 1000);
  }

  const bindPixArea = () => {
    const area = getPixArea();
    if (!area || !checkoutForm) return;
    if (area.dataset.pixInit === '1') return;
    area.dataset.pixInit = '1';

    const radios = checkoutForm.querySelectorAll('input[name="checkout-payment-method"]');
    const getSelectedMethod = () => {
      const selected = checkoutForm.querySelector('input[name="checkout-payment-method"]:checked');
      return selected ? selected.value : 'pix';
    };

    const stopPixCountdown = () => {
      if (pixTimer) {
        clearInterval(pixTimer);
        pixTimer = null;
      }
      pixEndAt = null;
      setPixExpiredUI(false);
      const countdownEl = area.querySelector('#pix-countdown');
      if (countdownEl) {
        countdownEl.classList.remove('is-urgent');
        countdownEl.textContent = formatCountdown(10 * 60 * 1000);
      }
    };

    const onPaymentMethodChange = () => {
      const method = getSelectedMethod();
      if (method === 'pix') {
        startPixCountdown(10 * 60 * 1000);
      } else {
        stopPixCountdown();
      }
    };

    radios.forEach((r) => r.addEventListener('change', onPaymentMethodChange));
    onPaymentMethodChange();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindPixArea, { once: true });
  } else {
    bindPixArea();
  }

 
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const firstNameInput = document.getElementById('checkout-first-name');
      const lastNameInput = document.getElementById('checkout-last-name');
      const emailInput = document.getElementById('checkout-email');
      const cpfInput = document.getElementById('checkout-cpf');
      const phoneInput = document.getElementById('checkout-phone');
      const zipInput = document.getElementById('checkout-zip');
      const paymentMethodInput = checkoutForm.querySelector('input[name="checkout-payment-method"]:checked');
      const cardNumberInput = document.getElementById('checkout-card-number');
      const cardHolderInput = document.getElementById('checkout-card-holder');
      const cardExpInput = document.getElementById('checkout-card-expiration');
      const cardCvvInput = document.getElementById('checkout-card-cvv');
      const cardBrandSelect = document.getElementById('checkout-card-brand');
      const installmentsSelect = document.getElementById('checkout-installments');

      const firstName = (firstNameInput?.value || '').trim();
      const lastName = (lastNameInput?.value || '').trim();
      const email = (emailInput?.value || '').trim();
      const cpf = (cpfInput?.value || '').trim();
      const phone = (phoneInput?.value || '').trim();
      const zipCode = (zipInput?.value || '').trim();
      const paymentMethodRaw = paymentMethodInput ? paymentMethodInput.value : 'pix';
      const isPix = paymentMethodRaw === 'pix';

      if (!firstName || !lastName || !email || !cpf || !phone || !zipCode) return;

      let cardNumber = '';
      let cardHolder = '';
      let cardExp = '';
      let cardCvv = '';
      let cardBrand = '';
      let installments = 1;

      if (!isPix) {
        cardNumber = (cardNumberInput?.value || '').trim();
        cardHolder = (cardHolderInput?.value || '').trim();
        cardExp = (cardExpInput?.value || '').trim();
        cardCvv = (cardCvvInput?.value || '').trim();
        cardBrand = (cardBrandSelect?.value || '').trim();
        installments = Number(installmentsSelect?.value || 1);

        if (!cardNumber || !cardHolder || !cardExp || !cardCvv || !cardBrand || !installments) {
          return;
        }
      }

      const fullName = `${firstName} ${lastName}`.trim();

      const occupation = lastSearchPayload.occupation || lastSearchPayload;
      const adults = Number(occupation.adults || 0);
      const childrenCount =
        Array.isArray(occupation.children)
          ? occupation.children.length
          : Number(occupation.children || 0);
      const childrenAges = Array.isArray(occupation.children) ? occupation.children : [];

      const baseTotal = Number(selectedRoom.totalPrice || 0);
      const bookingTotal = isPix ? Number((baseTotal * 0.9).toFixed(2)) : baseTotal;
      const bookingPaymentMethod = isPix ? 'PIX' : 'CREDIT_CARD';

      const payload = {
        firstName,
        lastName,
        email,
        cpf,
        phone,
        zipCode,
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        ibge: '',
        birthDate: '',
        gender: '',
        checkin: occupation.checkin,
        checkout: occupation.checkout,
        ratePlan: '',
        totalValue: bookingTotal,
        paymentMethod: bookingPaymentMethod,
        couponCode: '',
        rooms: [
          {
            roomType: selectedRoom.code,
            adults,
            children: childrenCount,
            childrenAges,
            value: bookingTotal
          }
        ]
      };

      if (checkoutMessageEl) {
        checkoutMessageEl.textContent = 'Enviando sua reserva...';
        checkoutMessageEl.className = 'checkout-message loading';
      }
      pixKey = '';
      pixEndAt = null;
      setPixExpiredUI(false);
      const pixCountdownEl = document.getElementById('pix-countdown');
      if (pixCountdownEl) pixCountdownEl.classList.remove('is-urgent');
      const qrImgEl = document.getElementById('pix-qrcode');
      if (qrImgEl) qrImgEl.removeAttribute('src');
      const pixCopyBtn = document.getElementById('copy-pix');
      if (pixCopyBtn) {
        pixCopyBtn.disabled = true;
        pixCopyBtn.textContent = pixCopyBtn.dataset.originalText || 'Copiar chave';
        pixCopyBtn.classList.remove('is-copied');
      }

      try {
        const response = await fetch(BOOKING_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data || !data.success) {
          if (checkoutMessageEl) {
            checkoutMessageEl.textContent = 'Não foi possível criar a reserva. Tente novamente em instantes.';
            checkoutMessageEl.className = 'checkout-message error';
          }
          return;
        }

        lastBookingId = data.bookingId || data.numero_reserva || null;

        if (!lastBookingId) {
          if (checkoutMessageEl) {
            checkoutMessageEl.textContent = 'Reserva criada, mas não foi possível identificar o código. Contate o suporte.';
            checkoutMessageEl.className = 'checkout-message error';
          }
          return;
        }

        if (checkoutMessageEl) {
          checkoutMessageEl.textContent = isPix
            ? 'Reserva criada! Gerando pagamento Pix com 10% de desconto...'
            : 'Reserva criada! Processando pagamento no cartão...';
          checkoutMessageEl.className = 'checkout-message loading';
        }

        const amountBase = bookingTotal;
        const amountCents = Math.round(amountBase * 100);

        const paymentPayload = isPix
          ? {
              paymentType: 'Pix',
              amount: amountCents,
              merchantOrderId: lastBookingId,
              customerName: fullName
            }
          : {
              paymentType: 'CreditCard',
              amount: amountCents,
              merchantOrderId: lastBookingId,
              customerName: fullName,
              cardNumber,
              holder: cardHolder,
              expirationDate: cardExp,
              securityCode: cardCvv,
              brand: cardBrand,
              installments
            };

        const paymentResp = await fetch(PAYMENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentPayload)
        });

        const paymentData = await paymentResp.json().catch(() => ({}));

        if (!paymentResp.ok) {
          if (checkoutMessageEl) {
            const msg = paymentData && paymentData.error
              ? paymentData.error
              : 'Não foi possível processar o pagamento. Tente novamente.';
            checkoutMessageEl.textContent = msg;
            checkoutMessageEl.className = 'checkout-message error';
          }
          return;
        }

        console.log('Pagamento criado:', paymentData);

        if (isPix) {
          if (checkoutMessageEl) {
            checkoutMessageEl.textContent = 'Pagamento Pix gerado! Escaneie o QR Code ou copie a chave.';
            checkoutMessageEl.className = 'checkout-message success';
          }
          const payment = paymentData.Payment || paymentData.payment || paymentData;
          const qrString =
            payment.QrCodeString ||
            payment.QRCodeString ||
            payment.QRCode ||
            '';
          const qrBase64 =
            payment.QrCodeBase64Image ||
            payment.QRCodeBase64Image ||
            payment.QrCodeImage ||
            payment.QRCodeImage ||
            payment.QrCode?.Base64Image ||
            payment.QRCode?.Base64Image ||
            payment.QrCode?.QrCodeBase64Image ||
            payment.QRCode?.QrCodeBase64Image ||
            '';
          const pixArea = document.getElementById('checkout-pix-area');
          const qrImg = document.getElementById('pix-qrcode');
          const pixCopyBtn = document.getElementById('copy-pix');
          if (pixArea && qrImg && qrString) {
            pixKey = qrString;
            if (qrBase64) {
              qrImg.src = `data:image/png;base64,${qrBase64}`;
            } else {
              qrImg.removeAttribute('src');
            }
            pixArea.style.display = 'block';
            if (pixCopyBtn) pixCopyBtn.disabled = false;
            setPixTotalValue(bookingTotal);
            startPixCountdown(10 * 60 * 1000);
          }
        } else {
          const payment = paymentData.Payment || paymentData.payment || paymentData;
          const status = payment.Status || payment.status || '';
          if (checkoutMessageEl) {
            checkoutMessageEl.textContent = status
              ? `Pagamento no cartão enviado para a Cielo. Status: ${status}.`
              : 'Pagamento no cartão enviado para a Cielo.';
            checkoutMessageEl.className = 'checkout-message success';
          }
        }
      } catch (err) {
        console.error('Erro ao criar reserva:', err);
        if (checkoutMessageEl) {
          checkoutMessageEl.textContent = 'Erro de comunicação com o servidor. Tente novamente.';
          checkoutMessageEl.className = 'checkout-message error';
        }
      }
    });
  }

  const renderRooms = (rooms) => {
    if (!resultsEl) return;

    if (!rooms || rooms.length === 0) {
      resultsEl.innerHTML = '<div class="availability-error">Não encontramos quartos disponíveis para as datas e ocupação selecionadas.</div>';
      return;
    }

    rooms = [...rooms].sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));

    const carouselHTML = `
      <div class="rooms-carousel-wrapper">
        <div class="rooms-carousel-container" id="rooms-carousel-container">
          ${rooms.map((room, idx) => {
      const meta = ROOM_METADATA[room.code] || {
        name: room.name,
        description: room.description || '',
        image: '',
        features: []
      };
      const hasImage = !!meta.image;
      let nightsCount = null;
      try {
        const u = new URL(room.bookingUrl);
        const ci = u.searchParams.get("checkin");
        const co = u.searchParams.get("checkout");
        if (ci && co) {
          const d1 = new Date(ci);
          const d2 = new Date(co);
          nightsCount = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        }
      } catch { }
      const perNight = nightsCount ? (Number(room.totalPrice) / nightsCount) : null;

      return `
              <article class="room-card--v2">
                ${hasImage ? `
                  <div class="room-card__media">
                    <img src="${meta.image}" alt="${meta.name}" class="room-card__img" loading="lazy">
                    <div class="room-card__overlay"></div>
                    <div class="room-card__badge">
                      <i class="fa-solid fa-users"></i>
                      <span>Até ${meta.maxOccupancy || room.apiMaxOccupancy} hóspedes</span>
                    </div>
                    ${idx === 0 ? `<div class="room-card__pill room-card__pill--best"><i class="fa-solid fa-bolt"></i><span>Melhor preço</span></div>` : ''}
                  </div>
                ` : ''}
                <div class="room-card__body">
                  <header class="room-card__header">
                    <h3 class="room-card__title">${meta.name}</h3>
                    <div class="room-card__meta"><span class="room-card__meta-item"><i class="fa-solid fa-check"></i><span>All Fun Inclusive</span></span></div>
                  </header>
                  ${meta.description ? `<p class="room-card__desc">${meta.description}</p>` : ''}
                  ${meta.features?.length ? `<div class="room-card__chips">${meta.features.slice(0, 3).map(f => `<span class="room-card__chip"><i class="fa-solid fa-${f.icon}"></i>${f.name}</span>`).join('')}</div>` : ''}
                  <div class="room-card__footer">
                    <div class="room-card__pricebox">
                      <div class="room-card__price-top">
                        <span class="room-card__price-label">Total da estadia</span>
                        ${perNight ? `<span class="room-card__price-sub">~ ${perNight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / noite</span>` : ''}
                      </div>
                      <div class="room-card__price">${Number(room.totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                      <div class="room-card__fineprint">Em até 10x no cartão • Confirmação rápida</div>
                    </div>
                    <a href="#" 
                       class="room-card__cta js-open-checkout" 
                       data-room-code="${room.code}" 
                       data-room-name="${meta.name}" 
                       data-room-total="${room.totalPrice}" 
                       aria-label="Reservar ${meta.name}">
                      <span>Reservar agora</span>
                      <i class="fa-solid fa-arrow-right"></i>
                    </a>
                  </div>
                </div>
              </article>
            `;
    }).join('')}
        </div>
        ${rooms.length > 1 ? `
          <button class="carousel-arrow carousel-arrow--prev" id="carousel-prev" aria-label="Anterior">
            ‹
          </button>
          <button class="carousel-arrow carousel-arrow--next" id="carousel-next" aria-label="Próximo">
            ›
          </button>
          <div class="carousel-dots" id="carousel-dots">
            ${rooms.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;

    resultsEl.innerHTML = carouselHTML;
    resultsEl.style.display = 'block';

    if (resultsEl) {
      const handler = (event) => {
        const target = event.target.closest('.js-open-checkout');
        if (!target) return;
        event.preventDefault();
        const code = target.getAttribute('data-room-code');
        if (!code) return;
        const room = (lastRooms || []).find(r => r.code === code);
        if (!room) return;
        selectedRoom = room;
        openCheckoutForRoom(room);
      };
      resultsEl.onclick = handler;
    }

    if (rooms.length > 1) {
      const carouselContainer = document.getElementById('rooms-carousel-container');
      const dots = Array.from(document.querySelectorAll('.carousel-dot'));
      const slides = Array.from(carouselContainer.querySelectorAll('.room-card--v2'));
      const prevBtn = document.getElementById('carousel-prev');
      const nextBtn = document.getElementById('carousel-next');

      const getItemsPerScreen = () => {
        if (window.innerWidth >= 768) return 3;
        return 1;
      };

      const getGapPx = () => {
        const cs = window.getComputedStyle(carouselContainer);
        const gap = parseFloat(cs.columnGap || cs.gap || "0");
        return isNaN(gap) ? 0 : gap;
      };

      const getStep = () => {
        const gap = getGapPx();
        const first = slides[0];
        if (!first) return carouselContainer.clientWidth;
        const w = first.getBoundingClientRect().width;
        return w + gap;
      };

      const setActiveDot = (idx) => {
        dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
      };

      // Lógica de Scroll e Dots
      let ticking = false;
      carouselContainer.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const step = getStep();
          const itemsPerScreen = getItemsPerScreen();
          
          // Calcula o índice baseado no item visível no centro/início
          const scrollLeft = carouselContainer.scrollLeft;
          const idx = Math.max(0, Math.min(dots.length - 1, Math.round(scrollLeft / step)));
          
          setActiveDot(idx);
          ticking = false;
        });
      }, { passive: true });

      dots.forEach((dot) => {
        dot.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index, 10) || 0;
          const step = getStep();
          carouselContainer.scrollTo({ left: idx * step, behavior: 'smooth' });
        });
      });

      // Lógica das Setas
      if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
          const step = getStep();
          const itemsPerScreen = getItemsPerScreen();
          // No desktop, movemos de 1 em 1 para suavidade
          carouselContainer.scrollBy({ left: -step, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
          const step = getStep();
          const itemsPerScreen = getItemsPerScreen();
          carouselContainer.scrollBy({ left: step, behavior: 'smooth' });
        });
      }

      // Suporte a Arrastar (Mouse Drag) apenas para Desktop (evita conflito com touch nativo)
      let isDown = false;
      let startX;
      let scrollLeft;

      const onMouseDown = (e) => {
        if (e.pointerType === 'touch') return; // ignora touch, deixa o nativo agir
        isDown = true;
        carouselContainer.classList.add('is-dragging');
        startX = e.pageX - carouselContainer.offsetLeft;
        scrollLeft = carouselContainer.scrollLeft;
      };

      const onMouseLeave = () => {
        isDown = false;
        carouselContainer.classList.remove('is-dragging');
      };

      const onMouseUp = () => {
        isDown = false;
        carouselContainer.classList.remove('is-dragging');
      };

      const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carouselContainer.offsetLeft;
        const walk = (x - startX);
        carouselContainer.scrollLeft = scrollLeft - walk;
      };

      carouselContainer.addEventListener('mousedown', onMouseDown);
      carouselContainer.addEventListener('mouseleave', onMouseLeave);
      carouselContainer.addEventListener('mouseup', onMouseUp);
      carouselContainer.addEventListener('mousemove', onMouseMove);

      // garante dot inicial certo
      setActiveDot(0);
    }
  };

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

      // Se for apenas 1 dia selecionado, checkout é no dia seguinte
      if (formatYmd(checkin) === formatYmd(checkout)) {
        checkout.setDate(checkout.getDate() + 1);
      }

      // Prepara dados para a API - RESTAURADO para o formato original que o servidor espera
      const requestData = {
        occupation: {
          checkin: formatYmd(checkin),
          checkout: formatYmd(checkout),
          adults: adults,
          children: kids
        }
      };

      console.log('Request Data (Restored):', requestData);
      fetchAvailability(requestData);
    });
  }

  window.initCheckoutPix = function initCheckoutPix() {
    console.log('PIX INIT EXECUTADO');

    const pixArea = document.getElementById('checkout-pix-area');
    const cardFields = document.getElementById('checkout-card-fields');
    const paymentRadios = checkoutForm
      ? checkoutForm.querySelectorAll('input[name="checkout-payment-method"]')
      : document.querySelectorAll('input[name="checkout-payment-method"]');

    if (!pixArea || !cardFields || paymentRadios.length === 0) {
      console.warn('PIX não encontrou elementos.');
      return;
    }

    const prevHandler = window.__checkoutPixUpdatePaymentUI;
    if (typeof prevHandler === 'function') {
      paymentRadios.forEach((radio) => {
        radio.removeEventListener('change', prevHandler);
      });
    }

    function updatePaymentUI() {
      const selected = checkoutForm
        ? checkoutForm.querySelector('input[name="checkout-payment-method"]:checked')
        : document.querySelector('input[name="checkout-payment-method"]:checked');
      if (!selected) return;

      if (selected.value === 'pix') {
        pixArea.style.display = 'block';
        cardFields.style.display = 'none';
        if (!pixTimer && !pixExpired && pixKey && pixEndAt) {
          startPixCountdown(Math.max(0, pixEndAt - Date.now()));
        }
      } else {
        pixArea.style.display = 'none';
        cardFields.style.display = 'block';
      }
    }

    window.__checkoutPixUpdatePaymentUI = updatePaymentUI;

    paymentRadios.forEach((radio) => {
      radio.removeEventListener('change', updatePaymentUI);
      radio.addEventListener('change', updatePaymentUI);
    });

    updatePaymentUI();
  };

})();
