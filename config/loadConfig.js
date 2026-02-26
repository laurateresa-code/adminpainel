import { supabase } from './supabaseClient.js';

const sessionTimestamp = Date.now();

async function loadConfig() {
  try {
    let config = null;

    // Tentar carregar do Supabase primeiro
    try {
      // Obter ID do projeto ou Slug da URL
      const urlParams = new URLSearchParams(window.location.search);
      let projectId = urlParams.get('id');
      const slug = window.location.pathname.split('/').filter(Boolean).pop();
      
      if (projectId || slug) {
          let query = supabase.from('site_settings').select('setting_value, project_id');
          
          if (projectId) {
            query = query.eq('project_id', projectId);
          } else if (slug && !slug.endsWith('.html')) {
            // Se tiver slug e não for um arquivo .html, buscar o project_id pelo slug
            const { data: project } = await supabase
              .from('projects')
              .select('id')
              .eq('slug', slug)
              .single();
            
            if (project) {
              projectId = project.id;
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
          }
      } else {
          console.log('Nenhum ID ou Slug de projeto na URL, tentando carregar local...');
      }
    } catch (sbError) {
      console.warn('Erro ao conectar com Supabase, tentando local...', sbError);
    }

    // Se falhou no Supabase, tenta local
    if (!config) {
      console.log('Carregando configuração local (fallback)...');
      const response = await fetch('config/config.json?t=' + sessionTimestamp);
      if (!response.ok) throw new Error('Falha ao carregar config.json');
      config = await response.json();
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
                     node.querySelector('[data-config-src]') || 
                     node.querySelector('[data-config-text]')) {
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
    subscribeToChanges();

  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
  }
}

function subscribeToChanges() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  // Se temos um projeto específico, filtramos por ele. 
  // Caso contrário, monitoramos 'main_config' globalmente (embora idealmente devêssemos ter um projeto).
  const filterString = projectId ? `project_id=eq.${projectId}` : `setting_name=eq.main_config`;

  supabase
    .channel('site_settings_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'site_settings',
        filter: filterString
      },
      (payload) => {
        console.log('Mudança detectada no Supabase!', payload);
        
        // Verificação adicional de segurança
        if (projectId && payload.new.project_id !== projectId) return;
        
        if (payload.new && payload.new.setting_value) {
            const newConfig = payload.new.setting_value;
            window.loadedConfig = newConfig;
            
            // Reaplicar tudo
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
      }
    )
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
    if (key === 'btnRecreacao1Text') cssVar = '--btn-recreacao-1-text';
    if (key === 'btnRecreacao2Text') cssVar = '--btn-recreacao-2-text';
    if (key === 'btnFooterText') cssVar = '--btn-footer-text';
    
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

  const enabledRaw = agenda?.enabled;
  const enabled = enabledRaw !== false && enabledRaw !== 'false';

  const dayBgColor = agenda?.dayBgColor;
  if (typeof dayBgColor === 'string' && dayBgColor.trim()) {
    agendaEl.style.setProperty('--color-calendar-day-bg', dayBgColor.trim());
  } else {
    agendaEl.style.removeProperty('--color-calendar-day-bg');
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
  const bgColor = variables?.programacoes?.bgColor;
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

// Iniciar carregamento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadConfig);
} else {
  loadConfig();
}
