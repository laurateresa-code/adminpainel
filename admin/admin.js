import { supabase } from '../config/supabaseClient.js';

// Estado global da configuração
let currentConfig = {};
let currentProjectId = null;

// Obter ID do projeto da URL
const urlParams = new URLSearchParams(window.location.search);
currentProjectId = urlParams.get('id');

// Verificar sessão e projeto
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  
  // Buscar nome do perfil para exibir
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();
    
    const userDisplay = document.getElementById('user-email');
    if (userDisplay) {
      userDisplay.textContent = (profile && profile.full_name) ? profile.full_name : session.user.email;
    }
  } catch (e) {
    console.warn('Erro ao carregar perfil:', e);
  }
  
  if (!currentProjectId) {
      // Se não tem ID, manda pro dashboard
      window.location.href = 'dashboard.html';
      return;
  }
  
  // Verificar se o projeto existe e pertence ao usuário (opcional, mas bom)
  // Por enquanto, confiamos que o loadConfig vai falhar ou retornar vazio se não tiver permissão
}

// Carregar configuração ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  
  // Atualizar link de voltar (se existir) ou criar um
  addBackToDashboardLink();

  setupTabs();
  await loadConfig();
  setupEventListeners();
  setupTopbarActions();
  
  // Setup Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
  }
});

function addBackToDashboardLink() {
    // Verifica se já adicionamos o header
    if (document.getElementById('project-header')) return;

    const main = document.querySelector('.content');
    if (main) {
        const header = document.createElement('div');
        header.id = 'project-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '20px';
        header.style.paddingBottom = '15px';
        header.style.borderBottom = '1px solid var(--border)';
        
        // Botão Voltar
        const backLink = document.createElement('a');
        backLink.href = 'dashboard.html';
        backLink.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar aos Projetos';
        backLink.style.textDecoration = 'none';
        backLink.style.color = 'var(--text-muted)';
        backLink.style.fontWeight = '500';
        backLink.style.display = 'flex';
        backLink.style.alignItems = 'center';
        backLink.style.gap = '8px';
        
        // Botão Ver Site (Ícone de Olho)
        const viewLink = document.createElement('a');
        viewLink.href = `../index.html?id=${currentProjectId}`;
        viewLink.target = '_blank';
        viewLink.title = 'Visualizar Site';
        viewLink.innerHTML = '<i class="fas fa-eye" style="font-size: 1.2rem;"></i>';
        viewLink.style.textDecoration = 'none';
        viewLink.style.color = '#ffffff';
        viewLink.style.display = 'flex';
        viewLink.style.alignItems = 'center';
        viewLink.style.justifyContent = 'center';
        viewLink.style.width = '42px';
        viewLink.style.height = '42px';
        viewLink.style.background = 'var(--color-primary, #646cff)';
        viewLink.style.borderRadius = '50%';
        viewLink.style.boxShadow = '0 4px 12px rgba(100, 108, 255, 0.3)';
        viewLink.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        viewLink.onmouseover = () => { 
            viewLink.style.transform = 'scale(1.15) translateY(-2px)'; 
            viewLink.style.boxShadow = '0 6px 16px rgba(100, 108, 255, 0.4)';
            viewLink.style.filter = 'brightness(1.1)';
        };
        viewLink.onmouseout = () => { 
            viewLink.style.transform = 'scale(1) translateY(0)'; 
            viewLink.style.boxShadow = '0 4px 12px rgba(100, 108, 255, 0.3)';
            viewLink.style.filter = 'brightness(1)';
        };
        
        header.appendChild(backLink);
        header.appendChild(viewLink);
        
        main.insertBefore(header, main.firstChild);
    }
}

// Configuração de Abas
function setupTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active from all
      navItems.forEach(n => n.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      // Add active to current
      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        if (targetId === 'users') {
          loadUsersProfiles();
        }
      }
    });
  });
}

async function loadConfig() {
  try {
    // Tentar carregar do Supabase para este projeto
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('project_id', currentProjectId)
      .eq('setting_name', 'main_config')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Erro ao carregar do Supabase:', error);
    }

    if (data && data.setting_value) {
      currentConfig = data.setting_value;
      console.log('Configuração carregada do Supabase para o projeto', currentProjectId);
    } else {
      // Fallback para arquivo local se não existir no banco (primeiro load)
      console.log('Carregando configuração local padrão...');
      const response = await fetch('../config/config.json');
      if (!response.ok) throw new Error('Falha ao carregar config local');
      currentConfig = await response.json();
    }
    
    populateForm(currentConfig);
    renderProgramacoesScheduleEditor();
  } catch (error) {
    console.error(error);
    showStatus('Erro ao carregar configurações: ' + error.message, 'error');
  }
}

function populateForm(config) {
  const aliases = {
    'variables.programacoes.enabled': 'variables.programacaoInfantil.enabled',
    'variables.programacoes.position': 'variables.programacaoInfantil.position'
  };

  // Percorre todos os inputs com data-path
  document.querySelectorAll('[data-path]').forEach(input => {
    const path = input.dataset.path;
    let value = getNestedValue(config, path);
    if (value === undefined && aliases[path]) {
      value = getNestedValue(config, aliases[path]);
    }
    
    if (value !== undefined) {
      if (input.type === 'checkbox') {
        input.checked = value === true || value === 'true';
      } else {
        input.value = value;
      }
      
      // Se for cor, atualiza o hex text
      if (input.type === 'color') {
        const hexInput = document.querySelector(`[data-sync="${input.id}"]`);
        if (hexInput) hexInput.value = value;
      }

      // Se for imagem, atualiza o preview
      if (path.startsWith('images.')) {
        const imgKey = path.split('.')[1];
        const preview = document.getElementById(`preview-${imgKey}`);
        if (preview) {
           // Se for URL completa (Supabase), usa direto. Se for relativa, ajusta.
           if (value.startsWith('http')) {
             preview.src = value;
           } else {
             preview.src = `/${value}?t=${Date.now()}`;
           }
        }
      }
    }
  });
}

// Utilitário para pegar valor aninhado "colors.primary"
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

// Utilitário para setar valor aninhado
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function ensureProgramacoesSchedule() {
  if (!currentConfig.variables) currentConfig.variables = {};
  if (!currentConfig.variables.programacoes) currentConfig.variables.programacoes = {};
  if (!currentConfig.variables.programacoes.schedule) currentConfig.variables.programacoes.schedule = {};

  const programs = ['infantil', 'teens', 'adulta'];
  const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

  programs.forEach((program) => {
    if (!currentConfig.variables.programacoes.schedule[program]) currentConfig.variables.programacoes.schedule[program] = {};
    days.forEach((day) => {
      if (!Array.isArray(currentConfig.variables.programacoes.schedule[program][day])) {
        currentConfig.variables.programacoes.schedule[program][day] = [];
      }
    });
  });
}

function renderProgramacoesScheduleEditor() {
  const root = document.getElementById('programacoesScheduleEditor');
  if (!root) return;

  ensureProgramacoesSchedule();

  const programDefs = [
    { key: 'infantil', label: 'Programação Infantil' },
    { key: 'teens', label: 'Programação Teens' },
    { key: 'adulta', label: 'Programação Adulta' }
  ];

  const dayDefs = [
    { key: 'segunda', label: 'Segunda-Feira' },
    { key: 'terca', label: 'Terça-Feira' },
    { key: 'quarta', label: 'Quarta-Feira' },
    { key: 'quinta', label: 'Quinta-Feira' },
    { key: 'sexta', label: 'Sexta-Feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  let html = '';
  programDefs.forEach((program) => {
    html += `<div class="schedule-program" data-program="${program.key}">`;
    html += `<div class="schedule-program__title">${program.label}</div>`;
    html += `<div class="schedule-days">`;

    dayDefs.forEach((day) => {
      const items = currentConfig.variables.programacoes.schedule[program.key][day.key] || [];
      html += `<div class="schedule-day" data-day="${day.key}">`;
      html += `
        <div class="schedule-day__header">
          <div class="schedule-day__name">${day.label}</div>
          <div class="schedule-day__actions">
            <button type="button" class="schedule-btn" data-action="add-schedule-item" data-program="${program.key}" data-day="${day.key}">Adicionar</button>
          </div>
        </div>
      `;
      html += `<div class="schedule-items">`;

      if (!items.length) {
        html += `<div class="schedule-empty">Nenhum item adicionado.</div>`;
      } else {
        items.forEach((item, idx) => {
          const time = item?.time ?? '';
          const text = item?.text ?? '';
          html += `
            <div class="schedule-item">
              <input type="text" value="${String(time).replace(/"/g, '&quot;')}" placeholder="08h00" data-schedule-field="time" data-program="${program.key}" data-day="${day.key}" data-index="${idx}">
              <input type="text" value="${String(text).replace(/"/g, '&quot;')}" placeholder="Descrição da atividade" data-schedule-field="text" data-program="${program.key}" data-day="${day.key}" data-index="${idx}">
              <button type="button" class="schedule-btn" data-action="remove-schedule-item" data-program="${program.key}" data-day="${day.key}" data-index="${idx}">Remover</button>
            </div>
          `;
        });
      }

      html += `</div>`;
      html += `</div>`;
    });

    html += `</div>`;
    html += `</div>`;
  });

  root.innerHTML = html;
}

function setupEventListeners() {
  // Atualizar HEX quando muda o color picker
  document.querySelectorAll('input[type="color"]').forEach(picker => {
    picker.addEventListener('input', (e) => {
      const hexInput = document.querySelector(`[data-sync="${e.target.id}"]`);
      if (hexInput) hexInput.value = e.target.value;
      updateConfigFromInput(e.target);
    });
  });

  // Atualizar Color Picker quando muda o HEX
  document.querySelectorAll('.color-hex').forEach(hex => {
    hex.addEventListener('input', (e) => {
      const pickerId = e.target.dataset.sync;
      const picker = document.getElementById(pickerId);
      if (picker && e.target.value.length === 7) {
        picker.value = e.target.value;
        updateConfigFromInput(picker);
      }
    });
  });

  // Inputs gerais (texto, textarea, select, number)
  document.querySelectorAll('input[type="text"], input[type="number"], textarea, select').forEach(input => {
    if (!input.readOnly) {
      input.addEventListener('change', (e) => {
        updateConfigFromInput(e.target);
      });
    }
  });

  // Checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(input => {
    if (!input.readOnly) {
      input.addEventListener('change', (e) => {
        updateConfigFromInput(e.target);
      });
    }
  });

  const scheduleRoot = document.getElementById('programacoesScheduleEditor');
  if (scheduleRoot) {
    scheduleRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const program = btn.dataset.program;
      const day = btn.dataset.day;
      const index = Number(btn.dataset.index || '-1');

      ensureProgramacoesSchedule();
      const list = currentConfig.variables.programacoes.schedule?.[program]?.[day];
      if (!Array.isArray(list)) return;

      if (action === 'add-schedule-item') {
        list.push({ time: '', text: '' });
        renderProgramacoesScheduleEditor();
        return;
      }

      if (action === 'remove-schedule-item') {
        if (Number.isInteger(index) && index >= 0 && index < list.length) {
          list.splice(index, 1);
          renderProgramacoesScheduleEditor();
        }
      }
    });

    scheduleRoot.addEventListener('input', (e) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement)) return;
      const field = input.dataset.scheduleField;
      if (!field) return;

      const program = input.dataset.program;
      const day = input.dataset.day;
      const index = Number(input.dataset.index || '-1');
      if (!program || !day || !Number.isInteger(index) || index < 0) return;

      ensureProgramacoesSchedule();
      const list = currentConfig.variables.programacoes.schedule?.[program]?.[day];
      if (!Array.isArray(list) || index >= list.length) return;

      if (!list[index]) list[index] = { time: '', text: '' };
      list[index][field] = input.value;
    });
  }

  // Botão Salvar
  document.getElementById('save-btn').addEventListener('click', saveConfig);
}

function updateConfigFromInput(input) {
  const path = input.dataset.path;
  if (path) {
    const value = input.type === 'checkbox' ? input.checked : input.value;
    setNestedValue(currentConfig, path, value);

    if (path === 'variables.programacoes.enabled') {
      setNestedValue(currentConfig, 'variables.programacaoInfantil.enabled', value);
    }
    if (path === 'variables.programacoes.position') {
      setNestedValue(currentConfig, 'variables.programacaoInfantil.position', value);
    }
  }
}

async function saveConfig() {
  const btn = document.getElementById('save-btn');
  const originalText = btn.innerText;
  btn.innerText = 'Salvando...';
  btn.disabled = true;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Upsert no Supabase
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        project_id: currentProjectId,
        setting_name: 'main_config', 
        setting_value: currentConfig,
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id, setting_name' });

    if (error) throw error;
    
    // Log de Atividade
    await logActivity(currentProjectId, session?.user?.id, 'update', { 
        message: 'Configurações atualizadas via painel editor'
    });

    // ATUALIZAR DATA DE EDIÇÃO E SINCRONIZAR MÊS/ANO NO PROJETO
    const eventMonth = currentConfig.agenda?.month || 2;
    const eventYear = currentConfig.agenda?.year || 2026;

    await supabase
      .from('projects')
      .update({ 
        updated_at: new Date().toISOString(),
        event_month: parseInt(eventMonth),
        event_year: parseInt(eventYear)
      })
      .eq('id', currentProjectId);

    showStatus('Alterações salvas no Supabase!', 'success');
  } catch (error) {
    console.error(error);
    showStatus('Erro ao salvar: ' + error.message, 'error');
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

// Upload de Imagem
window.handleImageUpload = async function(input, key, folder) {
  const file = input.files[0];
  if (!file) return;

  const btnLabel = input.nextElementSibling;
  const originalLabel = btnLabel.innerText;
  btnLabel.innerText = 'Enviando...';

  try {
    // Upload para Supabase Storage
    const fileExt = file.name.split('.').pop();
    // Nome único: folder/timestamp_random.ext
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('site-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('site-assets')
      .getPublicUrl(fileName);
      
    // Atualizar caminho no config local com a URL completa
    setNestedValue(currentConfig, `images.${key}`, publicUrl);
    
    // Atualizar input visual e preview
    document.getElementById(key).value = publicUrl;
    const preview = document.getElementById(`preview-${key}`);
    if(preview) preview.src = publicUrl;
    
    showStatus('Imagem enviada! Clique em Salvar para confirmar.', 'success');
  } catch (error) {
    console.error(error);
    showStatus('Erro no upload: ' + error.message, 'error');
  } finally {
    btnLabel.innerText = originalLabel;
    input.value = ''; // Reset input
  }
}

function showStatus(msg, type) {
  const status = document.getElementById('status-msg');
  status.innerText = msg;
  status.style.color = type === 'error' ? '#ef4444' : '#10b981';
  
  setTimeout(() => {
    status.innerText = '';
  }, 5000);
}

async function logActivity(projectId, userId, action, details) {
    try {
        await supabase.from('audit_logs').insert({
            project_id: projectId,
            user_id: userId,
            action: action,
            details: details
        });
    } catch (e) {
        console.warn('Erro ao salvar log:', e);
    }
}

let usersCache = [];
async function loadUsersProfiles() {
  try {
    const search = document.getElementById('users-search');
    if (search && !search.dataset.bound) {
      search.dataset.bound = 'true';
      search.addEventListener('input', () => renderUsersTable());
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, created_at, email');
    if (error) throw error;
    usersCache = data || [];
    renderUsersTable();
  } catch (e) {
    console.warn('Erro ao carregar usuários:', e);
    const tbody = document.getElementById('users-table-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="padding:12px;color:var(--text-muted)">Falha ao carregar usuários</td></tr>`;
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  const term = (document.getElementById('users-search')?.value || '').toLowerCase();
  const filtered = usersCache.filter(u => {
    const name = (u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:12px;color:var(--text-muted)">Nenhum usuário encontrado</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(u => {
    const created = u.created_at ? new Date(u.created_at).toLocaleDateString() : '—';
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid var(--border)">${u.full_name || '—'}</td>
        <td style="padding:10px;border-bottom:1px solid var(--border)">${u.email || '—'}</td>
        <td style="padding:10px;border-bottom:1px solid var(--border)">${created}</td>
        <td style="padding:10px;border-bottom:1px solid var(--border)"><span class="status-badge" style="display:inline-block;padding:4px 8px;border-radius:999px;background:#0f1523;border:1px solid var(--border);color:var(--text-muted)">Ativo</span></td>
      </tr>
    `;
  }).join('');
}

function setupTopbarActions() {
  const actions = document.querySelector('.topbar .actions');
  if (!actions) return;
  const buttons = actions.querySelectorAll('.icon-btn');
  const bellBtn = buttons[0];
  const menuBtn = buttons[1];
  const avatar = actions.querySelector('.avatar');
  if (avatar) {
    avatar.classList.add('visible');
    renderAvatarInitials(avatar);
    avatar.addEventListener('click', () => {
      showQuickMenu();
    });
  }
  if (bellBtn) {
    bellBtn.addEventListener('click', () => {
      showNotifications();
    });
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      showQuickMenu();
    });
  }
  document.addEventListener('click', (e) => {
    const pop = document.querySelector('.popover');
    if (!pop) return;
    const actionsEl = document.querySelector('.topbar .actions');
    if (!actionsEl) return;
    if (!pop.contains(e.target) && !actionsEl.contains(e.target)) {
      pop.remove();
    }
  });
}

function renderAvatarInitials(el) {
  try {
    el.innerHTML = '';
    const span = document.createElement('span');
    supabase.auth.getSession().then(({ data: { session } }) => {
      const base = (session?.user?.email || '').trim();
      const initials = base ? base.split('@')[0].slice(0,2) : 'US';
      span.textContent = initials.toUpperCase();
      el.appendChild(span);
    });
  } catch {}
}

async function showNotifications() {
  removeExistingPopover();
  const pop = document.createElement('div');
  pop.className = 'popover';
  const header = document.createElement('div');
  header.className = 'popover-header';
  header.textContent = 'Notificações';
  const list = document.createElement('ul');
  list.className = 'popover-list';
  pop.appendChild(header);
  pop.appendChild(list);
  document.body.appendChild(pop);
  try {
    let query = supabase.from('audit_logs').select('action, details, created_at').order('created_at', { descending: true }).limit(8);
    if (currentProjectId) query = query.eq('project_id', currentProjectId);
    const { data } = await query;
    const items = (data || []).map(d => {
      const li = document.createElement('li');
      li.className = 'popover-item';
      const date = new Date(d.created_at).toLocaleString();
      li.innerHTML = `<i class="fa-regular fa-bell"></i><div><div>${d.action}</div><div style="font-size:12px;color:var(--text-muted)">${date}</div></div>`;
      return li;
    });
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'popover-item';
      li.textContent = 'Sem notificações recentes';
      items.push(li);
    }
    items.forEach(i => list.appendChild(i));
  } catch {}
}

function showQuickMenu() {
  removeExistingPopover();
  const pop = document.createElement('div');
  pop.className = 'popover';
  const header = document.createElement('div');
  header.className = 'popover-header';
  header.textContent = 'Ações Rápidas';
  const list = document.createElement('ul');
  list.className = 'popover-list';
  const items = [
    { icon: 'fa-solid fa-table-columns', label: 'Ir para Projetos', action: () => { window.location.href = 'dashboard.html'; } },
    { icon: 'fa-regular fa-eye', label: 'Abrir Site', action: () => { if (currentProjectId) window.open(`../index.html?id=${currentProjectId}`, '_blank'); } },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Sair da Conta', action: async () => { await supabase.auth.signOut(); window.location.href = 'login.html'; } }
  ];
  items.forEach(it => {
    const li = document.createElement('li');
    li.className = 'popover-item';
    li.innerHTML = `<i class="${it.icon}"></i><span>${it.label}</span>`;
    li.addEventListener('click', it.action);
    list.appendChild(li);
  });
  pop.appendChild(header);
  pop.appendChild(list);
  document.body.appendChild(pop);
}

function removeExistingPopover() {
  const existing = document.querySelector('.popover');
  if (existing) existing.remove();
}
