import { supabase } from './supabaseClient.js';

const sessionTimestamp = Date.now();

async function loadConfig() {
  try {
    let config = null;
    let resolvedProjectId = null;
    let layoutTemplateConfig = null;

    // Tentar carregar do Supabase primeiro
    try {
      // Obter ID do projeto ou Slug da URL
      const urlParams = new URLSearchParams(window.location.search);
      let projectId = urlParams.get('id');
      const segments = window.location.pathname.split('/').filter(Boolean);
      const lastSeg = segments[segments.length - 1];
      // Suporte a rotas tipo /<slug>/view.html
      const slug = (lastSeg && lastSeg.endsWith('.html') && segments.length >= 2)
        ? segments[segments.length - 2]
        : lastSeg;
      
      if (projectId || slug) {
          let query = supabase.from('site_settings').select('setting_value, project_id');
          
          if (projectId) {
            query = query.eq('project_id', projectId);
            resolvedProjectId = projectId;
          } else if (slug) {
            // Buscar o project_id pelo slug detectado
            const { data: project } = await supabase
              .from('projects')
              .select('id')
              .eq('slug', slug)
              .single();
            
            if (project) {
              projectId = project.id;
              resolvedProjectId = projectId;
              query = query.eq('project_id', projectId);
            } else {
              projectId = null; // Não encontrou projeto com esse slug
            }
          }

          if (projectId) {
            const { data, error } = await query
              .eq('setting_name', 'main_config')
              .single();
            
            if (!error && data && data.setting_value) {
              config = data.setting_value;
              console.log('Configuração carregada do Supabase para projeto', projectId);
            }
          } else {
            // Fallback: pegar a configuração mais recente se não conseguimos identificar o projeto
            const { data: latestList, error: latestErr } = await supabase
              .from('site_settings')
              .select('setting_value, project_id, updated_at')
              .eq('setting_name', 'main_config')
              .order('updated_at', { ascending: false })
              .limit(1);
            if (!latestErr && Array.isArray(latestList) && latestList.length && latestList[0].setting_value) {
              config = latestList[0].setting_value;
              console.log('Configuração carregada do Supabase (mais recente, fallback)');
            }
          }
      } else {
          console.log('Nenhum ID ou Slug de projeto na URL, tentando carregar local...');
      }
    } catch (sbError) {
      console.warn('Erro ao conectar com Supabase, tentando local...', sbError);
    }

    // Se falhou no Supabase, tenta local
    let defaultConfig = {};
    try {
      const response = await fetch('config/config.json?t=' + sessionTimestamp);
      if (response.ok) {
        defaultConfig = await response.json();
      }
    } catch (e) {
      console.warn('Erro ao carregar config.json para merge:', e);
    }

    layoutTemplateConfig = defaultConfig;
    try {
      const template = await fetchCarnavalTemplateConfig();
      if (template?.config && typeof template.config === 'object') {
        layoutTemplateConfig = template.config;
      }
    } catch {}

    if (!config) {
      console.log('Usando configuração local (fallback)...');
      config = defaultConfig;
    } else {
      // Merge com defaults para garantir que campos faltantes não quebrem o layout
      config = deepMerge(defaultConfig, config);
    }

    try {
      const overrideRaw = localStorage.getItem('overrideConfig');
      if (overrideRaw) {
        const override = JSON.parse(overrideRaw);
        if (override && typeof override === 'object') {
          config = deepMerge(config, override);
          console.log('Aplicando override local de configuração (localStorage)');
        }
      }
    } catch {}

    if (layoutTemplateConfig && typeof layoutTemplateConfig === 'object') {
      config = applyTemplateLayout(config, layoutTemplateConfig);
      window.layoutTemplateConfig = layoutTemplateConfig;
    }

    applyMeta(config);
    applyColors(config.colors);
    applyTypography(config.typography);
    applyFrames(config.frames);
    applyImagesCSS(config.images);

    // Wait for sections to be loaded before applying DOM updates
    const checkAndApply = () => {
      if (document.querySelector('section')) { // Se já existe alguma section carregada
        applyImagesDOM(config.images);
        applyText(config.text);
        applyPricing(config.pricing);
        applyAgenda(config.agenda);
        applyVideo(config.video);
        applyFaq(config.faq);
        applyVariables(config.variables);
      }
    };

    // Tenta aplicar imediatamente
    checkAndApply();

    // Aplica novamente quando as seções estiverem prontas
    document.addEventListener('sections:ready', () => {
      applyImagesDOM(config.images);
      applyText(config.text);
      applyPricing(config.pricing);
      applyAgenda(config.agenda);
      applyVideo(config.video);
      applyFaq(config.faq);
      applyVariables(config.variables);
    });

    // --- NOVO: MutationObserver para garantir aplicação em elementos carregados dinamicamente ---
    window.loadedConfig = config; // Expor para uso no observer
    
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
             if (node.nodeType === 1) {
                 if (node.hasAttribute('data-config-src') || 
                     node.hasAttribute('data-config-text') || 
                     node.hasAttribute('data-config-html') || 
                     node.querySelector('[data-config-src]') || 
                     node.querySelector('[data-config-text]') ||
                     node.querySelector('[data-config-html]')) {
                     shouldUpdate = true;
                     break;
                 }
             }
          }
        }
        if (shouldUpdate) break;
      }
      
      if (shouldUpdate) {
          if (window.configUpdateTimeout) clearTimeout(window.configUpdateTimeout);
          window.configUpdateTimeout = setTimeout(() => {
              if (window.loadedConfig) {
                  applyImagesDOM(window.loadedConfig.images);
                  applyText(window.loadedConfig.text);
                  applyPricing(window.loadedConfig.pricing);
                  applyAgenda(window.loadedConfig.agenda);
                  applyVideo(window.loadedConfig.video);
                  applyVariables(window.loadedConfig.variables);
              }
          }, 100);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    // -----------------------------------------------------------------------------------------
    
    // Fallback: Tenta aplicar a cada 500ms por 2 segundos para garantir
    let attempts = 0;
    const interval = setInterval(() => {
      checkAndApply();
      attempts++;
      if (attempts >= 4) clearInterval(interval);
    }, 500);
    
    console.log('Configuração carregada com sucesso:', config.siteName);
    
    // Disparar evento customizado para avisar que a config foi carregada
    window.dispatchEvent(new Event('configLoaded'));

    // Inscrever-se para atualizações em tempo real do Supabase
    // Retrieve projectId again for the subscription scope
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    setupRealtimeSubscription(projectId, defaultConfig, layoutTemplateConfig);

  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
  }
}

function setupRealtimeSubscription(projectId, defaultConfig, layoutTemplateConfig) {
  if (!window.supabase) return;
  
  console.log('Iniciando subscrição realtime para projeto:', projectId);
  
  const filterString = projectId ? `project_id=eq.${projectId}` : `setting_name=eq.main_config`;

  supabase
    .channel('public:site_settings')
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'site_settings',
      filter: filterString
    }, (payload) => {
      console.log('Alteração de config recebida:', payload);
      if (payload.new && payload.new.setting_value) {
        let newConfig = payload.new.setting_value;
        if (defaultConfig) {
            newConfig = deepMerge(defaultConfig, newConfig);
        }

        const template = (layoutTemplateConfig && typeof layoutTemplateConfig === 'object')
          ? layoutTemplateConfig
          : (window.layoutTemplateConfig && typeof window.layoutTemplateConfig === 'object' ? window.layoutTemplateConfig : null);
        if (template) {
          newConfig = applyTemplateLayout(newConfig, template);
        }
        
        // Re-apply everything
        window.loadedConfig = newConfig;
        applyMeta(newConfig);
        applyColors(newConfig.colors);
        applyTypography(newConfig.typography);
        applyFrames(newConfig.frames);
        applyImagesCSS(newConfig.images);
        applyImagesDOM(newConfig.images);
        applyText(newConfig.text);
        applyPricing(newConfig.pricing);
        applyAgenda(newConfig.agenda);
        applyVideo(newConfig.video);
        applyFaq(newConfig.faq);
        applyVariables(newConfig.variables);
      }
    })
    .subscribe();
}

function applyMeta(config) {
  if (config.siteTitle) document.title = config.siteTitle;
  if (config.siteDescription) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', config.siteDescription);
  }
}

function applyColors(colors) {
  if (!colors) return;
  const root = document.documentElement;
  
  for (const [key, value] of Object.entries(colors)) {
    let cssVar = `--color-${camelToKebab(key)}`;
    
    if (key === 'bgMain') cssVar = '--bg-main';
    if (key === 'bgSurface') cssVar = '--bg-surface';
    if (key === 'bgDark') cssVar = '--bg-dark';
    if (key === 'bgBadges') cssVar = '--bg-badges';
    if (key === 'bgTripadvisor') cssVar = '--bg-tripadvisor';
    if (key === 'bgFeedback') cssVar = '--bg-feedback';
    if (key === 'bgAgenda') cssVar = '--bg-agenda';
    if (key === 'bgIntro') cssVar = '--bg-intro';
    if (key === 'btnIntroBg') cssVar = '--btn-intro-bg';
    if (key === 'btnRecreacao1Bg') cssVar = '--btn-recreacao-1-bg';
    if (key === 'btnRecreacao2Bg') cssVar = '--btn-recreacao-2-bg';
    if (key === 'btnFooterBg') cssVar = '--btn-footer-bg';
    if (key === 'btnIntroText') cssVar = '--btn-intro-text';
    if (key === 'btnRecreacao2Text') cssVar = '--btn-recreacao-2-text';
    if (key === 'btnFooterBg') cssVar = '--btn-footer-bg';
    if (key === 'btnFooterText') cssVar = '--btn-footer-text';
    if (key === 'footerText') cssVar = '--footer-text';
    
    // Novos campos solicitados
    if (key === 'btnReserveBg') cssVar = '--btn-reserve-bg';
    if (key === 'btnReserveText') cssVar = '--btn-reserve-text';
    if (key === 'carouselNavBg') cssVar = '--carousel-nav-bg';
    if (key === 'carouselNavColor') cssVar = '--carousel-nav-color';
    if (key === 'btnShadow') cssVar = '--btn-shadow-color';
    if (key === 'feedbackDot') cssVar = '--feedback-dot-color';
    if (key === 'feedbackDotActive') cssVar = '--feedback-dot-active-color';
    if (key === 'footerIcon') cssVar = '--footer-icon-color';
    if (key === 'footerIconBg') cssVar = '--footer-icon-bg';
    if (key === 'promoText') cssVar = '--color-promo-text';
    if (key === 'promoHighlight') cssVar = '--color-promo-highlight';
    if (key === 'feedbackQuote') cssVar = '--color-feedback-quote';
    if (key === 'calendarText') cssVar = '--color-calendar-text';
    if (key === 'calendarDayText') cssVar = '--color-calendar-day-text';
    if (key === 'calendarBorder') cssVar = '--color-calendar-border';
    if (key === 'calendarHoverBg') cssVar = '--color-calendar-hover-bg';
    
    root.style.setProperty(cssVar, value);

    if (key === 'bgDark') {
      root.style.setProperty('--bg-footer-dark', value);
    }
  }
}

function applyTypography(typography) {
  if (!typography) return;
  const root = document.documentElement;
  if (typography.fontHeading) root.style.setProperty('--font-heading', typography.fontHeading);
  if (typography.fontBody) {
    root.style.setProperty('--font-body', typography.fontBody);
    root.style.setProperty('--font-base', typography.fontBody);
  }
  if (typography.sizeBase) {
    root.style.setProperty('--font-size-base', typography.sizeBase);
    root.style.setProperty('--size-base', typography.sizeBase);
  }
  if (typography.sizeH1) {
    root.style.setProperty('--h1-size', typography.sizeH1);
    root.style.setProperty('--size-h1', typography.sizeH1);
  }
  if (typography.sizeH2) {
    root.style.setProperty('--h2-size', typography.sizeH2);
    root.style.setProperty('--size-h2', typography.sizeH2);
  }
  if (typography.textColor) root.style.setProperty('--text-color', typography.textColor);
  
  // Title Strokes
  if (typography.titleStrokeWidth) root.style.setProperty('--text-stroke-width', typography.titleStrokeWidth);
  if (typography.titleStrokeColor) root.style.setProperty('--text-stroke-color', typography.titleStrokeColor);
  
  // Generic Colors
  if (typography.colorH1) root.style.setProperty('--h1-color', typography.colorH1);
  if (typography.colorH2) root.style.setProperty('--h2-color', typography.colorH2);
  if (typography.colorH3) root.style.setProperty('--h3-color', typography.colorH3);

  // Section Specific Colors
  if (typography.colorPrincipalTitle) root.style.setProperty('--color-principal-title', typography.colorPrincipalTitle);
  if (typography.colorIntroDesc) root.style.setProperty('--color-intro-desc', typography.colorIntroDesc);
  if (typography.colorIntroLabel) root.style.setProperty('--color-intro-label', typography.colorIntroLabel);
  if (typography.colorPromoHighlight) root.style.setProperty('--color-promo-highlight', typography.colorPromoHighlight);
  if (typography.colorCalendarTitle) root.style.setProperty('--color-calendar-title', typography.colorCalendarTitle);
  
  // Frames Variations
  if (typography.colorFramesVar1) root.style.setProperty('--color-frames-var1', typography.colorFramesVar1);
  if (typography.colorFramesVar2) root.style.setProperty('--color-frames-var2', typography.colorFramesVar2);
  if (typography.colorFramesVar3) root.style.setProperty('--color-frames-var3', typography.colorFramesVar3);
  if (typography.colorTurmaSubtitle) root.style.setProperty('--color-turma-subtitle', typography.colorTurmaSubtitle);
  
  // Feedback
  if (typography.colorFeedbackTitle) root.style.setProperty('--color-feedback-title', typography.colorFeedbackTitle);
  if (typography.colorFeedbackAuthor) root.style.setProperty('--color-feedback-author', typography.colorFeedbackAuthor);
  if (typography.colorFeedbackQuote) root.style.setProperty('--color-feedback-quote', typography.colorFeedbackQuote);
  
  // Gallery
  if (typography.colorGalleryTitle) root.style.setProperty('--color-gallery-title', typography.colorGalleryTitle);
}

function applyFrames(frames) {
  if (!frames) return;
  const root = document.documentElement;
  
  if (frames.borderWidth) root.style.setProperty('--frame-border-width', frames.borderWidth);
  if (frames.borderColor) root.style.setProperty('--frame-border-color', frames.borderColor);
}

function applyImagesCSS(images) {
  if (!images) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(images)) {
    const cssVar = `--${camelToKebab(key)}`;
    // Encode URI to handle spaces and special characters
    let encodedValue = encodeURI(value);
    // Se não for http (Supabase), adiciona timestamp para cache busting
    if (!value.startsWith('http') && value.startsWith('assets/')) {
      const separator = encodedValue.includes('?') ? '&' : '?';
      encodedValue += `${separator}t=${sessionTimestamp}`;
    }
    root.style.setProperty(cssVar, `url('${encodedValue}')`);
  }
}

function applyImagesDOM(images) {
  if (!images) return;
  for (const [key, value] of Object.entries(images)) {
    const elements = document.querySelectorAll(`[data-config-src="${key}"]`);
    elements.forEach(el => {
      // Encode URI to handle spaces and special characters
      let encodedValue = encodeURI(value);
       // Se não for http (Supabase), adiciona timestamp para cache busting
      if (!value.startsWith('http') && value.startsWith('assets/')) {
        const separator = encodedValue.includes('?') ? '&' : '?';
        encodedValue += `${separator}t=${sessionTimestamp}`;
      }
      el.src = encodedValue;
      el.alt = key;
    });
  }
}

function applyText(text) {
  if (!text) return;
  for (const [key, value] of Object.entries(text)) {
    const elements = document.querySelectorAll(`[data-config-text="${key}"]`);
    elements.forEach(el => {
      el.innerText = value;
    });
    
    // Support for HTML content (e.g. spans for styling)
    const htmlElements = document.querySelectorAll(`[data-config-html="${key}"]`);
    htmlElements.forEach(el => {
      el.innerHTML = value;
    });
  }
}

function applyPricing(pricing) {
  if (!pricing) return;
  const oldPriceEl = document.querySelector('.intro__price-old');
  const newPriceEl = document.querySelector('.intro__price-val');
  
  if (oldPriceEl) oldPriceEl.innerText = pricing.oldPrice;
  if (newPriceEl) newPriceEl.innerText = pricing.newPrice;
}

function applyAgenda(agenda) {
  if (!agenda) return;
  const agendaEl = document.getElementById('agenda');
  if (!agendaEl) return;
  const root = document.documentElement;

  const enabledRaw = agenda?.enabled;
  const enabled = enabledRaw !== false && enabledRaw !== 'false';

  const dayBgColor = agenda?.dayBgColor;
  if (typeof dayBgColor === 'string' && dayBgColor.trim()) {
    agendaEl.style.setProperty('--color-calendar-day-bg', dayBgColor.trim());
  } else {
    agendaEl.style.removeProperty('--color-calendar-day-bg');
  }

  const selectedBgColor = agenda?.selectedBgColor;
  if (typeof selectedBgColor === 'string' && selectedBgColor.trim()) {
    const val = selectedBgColor.trim();
    root.style.setProperty('--calendar-selected-bg', val);
    agendaEl.style.setProperty('--calendar-selected-bg', val);
  } else {
    root.style.removeProperty('--calendar-selected-bg');
    agendaEl.style.removeProperty('--calendar-selected-bg');
  }
  const selectedTextColor = agenda?.selectedTextColor;
  if (typeof selectedTextColor === 'string' && selectedTextColor.trim()) {
    const val = selectedTextColor.trim();
    root.style.setProperty('--calendar-selected-text', val);
    agendaEl.style.setProperty('--calendar-selected-text', val);
  } else {
    root.style.removeProperty('--calendar-selected-text');
    agendaEl.style.removeProperty('--calendar-selected-text');
  }

  const agendaNavLink = document.querySelector('a[href="#agenda"]');
  const agendaNavItem = agendaNavLink ? (agendaNavLink.closest('li') || agendaNavLink) : null;
  if (agendaNavItem) agendaNavItem.hidden = !enabled;

  agendaEl.hidden = !enabled;
  if (!enabled) return;

  if (agenda.month) agendaEl.dataset.month = agenda.month;
  if (agenda.year) agendaEl.dataset.year = agenda.year;
  document.dispatchEvent(new Event('agenda:update'));
}

function applyFaq(faq) {
  if (!faq || !Array.isArray(faq)) return;
  const list = document.querySelector('.faq-retro__list');
  if (!list) return;

  const previousOpen =
    (typeof list.dataset.faqOpen === 'string' && list.dataset.faqOpen.trim())
      ? list.dataset.faqOpen.trim()
      : (list.querySelector('.faq-retro__trigger[aria-expanded="true"] .faq-retro__question')?.textContent || '').trim();

  let html = '';
  faq.forEach(item => {
    html += `
    <div class="faq-retro__item">
      <button class="faq-retro__trigger" type="button" aria-expanded="false">
        <span class="faq-retro__icon">+</span>
        <span class="faq-retro__question">${item.question}</span>
      </button>
      <div class="faq-retro__content" hidden>
        <div class="faq-retro__inner">
          ${item.answer}
        </div>
      </div>
    </div>`;
  });
  list.innerHTML = html;

  if (previousOpen) {
    const triggers = Array.from(list.querySelectorAll('.faq-retro__trigger'));
    const match = triggers.find((btn) => (btn.querySelector('.faq-retro__question')?.textContent || '').trim() === previousOpen);
    if (match) {
      const panel = match.nextElementSibling && match.nextElementSibling.classList.contains('faq-retro__content')
        ? match.nextElementSibling
        : null;
      if (panel) {
        match.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        panel.style.maxHeight = `${panel.scrollHeight}px`;
        list.dataset.faqOpen = previousOpen;
      }
    }
  }
}

function applyVideo(video) {
  if (!video || !video.youtubeEmbed) return;
  const iframe = document.querySelector('.phone-content');
  if (iframe) {
    let url = video.youtubeEmbed;
    // Converter watch URL para embed URL se necessário
    if (url.includes('watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      url = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1`;
    }
    iframe.src = url;
  }
}

function applyVariables(variables) {
  const section = document.getElementById('programacao-infantil');
  if (!section) return;

  const enabledRaw = variables?.programacoes?.enabled ?? variables?.programacaoInfantil?.enabled;
  const enabled = enabledRaw === true || enabledRaw === 'true';
  if (!enabled) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  const position = variables?.programacoes?.position || variables?.programacaoInfantil?.position || 'afterIntro';
  const bgColor = variables?.programacoes?.bgColor || variables?.programacaoInfantil?.bgColor;
  if (typeof bgColor === 'string' && bgColor.trim()) {
    section.style.setProperty('--programacoes-bg', bgColor.trim());
  } else {
    section.style.removeProperty('--programacoes-bg');
  }

  const schedule = variables?.programacoes?.schedule;
  if (schedule && typeof schedule === 'object') {
    const containers = section.querySelectorAll('[data-programacoes-program][data-programacoes-day]');
    containers.forEach((el) => {
      const program = el.getAttribute('data-programacoes-program');
      const day = el.getAttribute('data-programacoes-day');
      const items = schedule?.[program]?.[day];
      if (!Array.isArray(items) || items.length === 0) {
        el.innerHTML = `<div class="kids-program__schedule-empty">Conteúdo em definição.</div>`;
        return;
      }

      const html = items
        .map((it) => {
          const time = String(it?.time ?? '').trim();
          const text = String(it?.text ?? '').trim();
          const safeTime = time.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `
            <div class="kids-program__schedule-item">
              <div class="kids-program__schedule-time">${safeTime}</div>
              <div class="kids-program__schedule-text">→ ${safeText}</div>
            </div>
          `;
        })
        .join('');

      el.innerHTML = html;
    });
  }

  const intro = document.getElementById('intro');
  const agenda = document.getElementById('agenda');
  const galeria = document.getElementById('galeria');
  const faq = document.getElementById('faq');
  const footer = document.querySelector('footer.site-footer');

  const insertAfter = (anchor) => {
    if (!anchor || !anchor.parentNode) return;
    anchor.parentNode.insertBefore(section, anchor.nextSibling);
  };

  const insertBefore = (anchor) => {
    if (!anchor || !anchor.parentNode) return;
    anchor.parentNode.insertBefore(section, anchor);
  };

  if (position === 'afterAgenda') return insertAfter(agenda);
  if (position === 'afterGaleria') return insertAfter(galeria);
  if (position === 'beforeFaq') return insertBefore(faq);
  if (position === 'beforeFooter') return insertBefore(footer);
  return insertAfter(intro);
}

function camelToKebab(string) {
  return string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function fetchCarnavalTemplateConfig() {
  const projectIdCandidates = [
    '7b1d4678-6980-4901-97ee-b69e25163ede',
  ];

  for (const projectId of projectIdCandidates) {
    try {
      const { data: templateSettings, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('project_id', projectId)
        .eq('setting_name', 'main_config')
        .single();

      if (!error && templateSettings?.setting_value) {
        return { projectId, config: templateSettings.setting_value };
      }
    } catch {}
  }

  const slugCandidates = ['carnaval', 'carna-village', 'carna-village-template', 'carna'];
  let templateProjectId = null;

  for (const slug of slugCandidates) {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .limit(1);
      if (Array.isArray(data) && data.length) {
        templateProjectId = data[0].id;
        break;
      }
    } catch {}
  }

  if (!templateProjectId) {
    const { data: templateProjects } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', '%Carna%')
      .limit(1);
    if (Array.isArray(templateProjects) && templateProjects.length) {
      templateProjectId = templateProjects[0].id;
    }
  }

  if (!templateProjectId) return null;

  const { data: templateSettings, error } = await supabase
    .from('site_settings')
    .select('setting_value')
    .eq('project_id', templateProjectId)
    .eq('setting_name', 'main_config')
    .single();

  if (error || !templateSettings?.setting_value) return null;
  return { projectId: templateProjectId, config: templateSettings.setting_value };
}

function applyTemplateLayout(targetConfig, templateConfig) {
  const out = { ...(targetConfig || {}) };

  if (templateConfig?.typography) {
    out.typography = deepMerge(out.typography || {}, templateConfig.typography);
  }
  if (templateConfig?.colors) {
    out.colors = deepMerge(out.colors || {}, templateConfig.colors);
  }
  if (templateConfig?.frames) {
    out.frames = deepMerge(out.frames || {}, templateConfig.frames);
  }
  out.variables = applyTemplateVariables(out.variables, templateConfig?.variables);

  return out;
}

function applyTemplateVariables(targetVariables, templateVariables) {
  const out = deepMerge(targetVariables || {}, {});
  if (!templateVariables || typeof templateVariables !== 'object') return out;

  if (templateVariables.programacaoInfantil && typeof templateVariables.programacaoInfantil === 'object') {
    const tpl = templateVariables.programacaoInfantil;
    out.programacaoInfantil = out.programacaoInfantil && typeof out.programacaoInfantil === 'object' ? out.programacaoInfantil : {};
    if (typeof tpl.enabled !== 'undefined') out.programacaoInfantil.enabled = tpl.enabled;
    if (typeof tpl.position === 'string' && tpl.position.trim()) out.programacaoInfantil.position = tpl.position;
    if (typeof tpl.bgColor === 'string') out.programacaoInfantil.bgColor = tpl.bgColor;
  }

  if (templateVariables.programacoes && typeof templateVariables.programacoes === 'object') {
    const tpl = templateVariables.programacoes;
    const existing = out.programacoes && typeof out.programacoes === 'object' ? out.programacoes : {};
    const schedule = existing.schedule;
    out.programacoes = existing;
    if (typeof tpl.enabled !== 'undefined') out.programacoes.enabled = tpl.enabled;
    if (typeof tpl.position === 'string' && tpl.position.trim()) out.programacoes.position = tpl.position;
    if (typeof tpl.bgColor === 'string') out.programacoes.bgColor = tpl.bgColor;
    if (schedule) out.programacoes.schedule = schedule;
  }

  return out;
}

// Deep Merge Utility
function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return target;

  const output = Array.isArray(target) ? [] : { ...target };
  
  if (Array.isArray(source)) return source.slice(); // Arrays are overwritten, not merged deeply

  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Iniciar carregamento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadConfig);
} else {
  loadConfig();
}
