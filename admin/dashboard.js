import { supabase } from '../config/supabaseClient.js';

const grid = document.getElementById('projects-grid');
const tableWrap = document.getElementById('projects-table-wrap');
const tbody = document.getElementById('projects-tbody');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search-input');
const filterMonth = document.getElementById('filter-month');
const filterYear = document.getElementById('filter-year');
const filterStatus = document.getElementById('filter-status');
const viewCardsBtn = document.getElementById('view-cards');
const viewTableBtn = document.getElementById('view-table');
const newProjectBtn = document.getElementById('new-project-btn');
const modal = document.getElementById('create-modal');
const createForm = document.getElementById('create-form');
const cancelCreate = document.getElementById('cancel-create');
const renameModal = document.getElementById('rename-modal');
const renameForm = document.getElementById('rename-form');
const renameNameInput = document.getElementById('rename-name');
const cancelRename = document.getElementById('cancel-rename');
const renameError = document.getElementById('rename-error');
const confirmRenameBtn = document.getElementById('confirm-rename');

let allProjects = [];
let viewMode = 'cards';

async function getProfileName(userId) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    if (data && data.full_name) return data.full_name;
  } catch (e) {
    console.warn('Erro ao buscar perfil:', e);
  }
  return null;
}

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  const profileName = await getProfileName(session.user.id);
  userEmailSpan.textContent = profileName || session.user.email;
  return session.user;
}

function applyFilters() { render(); }

searchInput.addEventListener('input', applyFilters);
filterMonth.addEventListener('change', applyFilters);
filterYear.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

function getMonthName(monthNumber) {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return months[monthNumber - 1] || '---';
}

async function loadProjects() {
  const user = await checkAuth();
  if (!user) return;

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('event_year', { ascending: true })
    .order('event_month', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao carregar projetos:', error);
    let errorMsg = 'Erro ao carregar projetos. Tente recarregar a página.';

    if (error.code === '42P01' || error.code === 'PGRST205') {
      errorMsg = `
        <div style="background: #fff5f5; border: 1px solid #feb2b2; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #c53030; margin-top: 0;">Sincronização Necessária</h3>
          <p>A tabela "projects" não foi encontrada ou o banco de dados precisa ser atualizado.</p>
          <p><strong>Para resolver:</strong></p>
          <ol style="text-align: left; display: inline-block;">
             <li>Vá ao <strong>SQL Editor</strong> do Supabase</li>
             <li>Copie o conteúdo de <code>supabase_setup.sql</code> e execute</li>
             <li>Copie o conteúdo de <code>supabase_migration_projects.sql</code> e execute</li>
          </ol>
          <br>
          <button onclick="location.reload()" class="btn-logout" style="background: var(--color-primary); margin-top: 10px;">Já executei, recarregar</button>
        </div>
      `;
    } else {
      errorMsg = `
        <div class="empty-state">
            ${errorMsg}<br>
            <small style="color: #999; display: block; margin-top: 10px;">Erro técnico: ${error.message}</small>
            <button onclick="console.log(window.lastSupabaseError); alert('Erro detalhado copiado para o console (F12)')" style="background: none; border: 1px solid #ccc; padding: 5px 10px; border-radius: 4px; font-size: 11px; margin-top: 10px; cursor: pointer;">Ver detalhes no console</button>
        </div>
      `;
      window.lastSupabaseError = error;
    }

    grid.innerHTML = errorMsg;
    return;
  }

  allProjects = projects || [];
  render();
}

function renderCards(projectsToRender){
  grid.innerHTML = '';

  if (!projectsToRender || projectsToRender.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = `Nenhum projeto criado ainda<br><br><button class="new-project" id="empty-create">Criar primeiro projeto</button>`;
    grid.appendChild(empty);
    const btn = empty.querySelector('#empty-create');
    btn.addEventListener('click', openCreateModal);
  }
  projectsToRender && projectsToRender.forEach(project=>{
    const status = project.status || 'rascunho';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="actions-mini">
            <button class="mini-btn" data-action="rename" data-id="${project.id}" data-name="${project.name}"><i class="fa-solid fa-pen"></i></button>
            <button class="mini-btn" data-action="delete" data-id="${project.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
        <a href="index.html?id=${project.id}" style="color:inherit;text-decoration:none">
            <div class="card-title">${project.name || 'Projeto'}</div>
        </a>
        <select class="status-select-mini" data-id="${project.id}">
            <option value="rascunho" ${status==='rascunho'?'selected':''}>Rascunho</option>
            <option value="publicado" ${status==='publicado'?'selected':''}>Publicado</option>
            <option value="finalizado" ${status==='finalizado'?'selected':''}>Finalizado</option>
        </select>
    `;
    const statusSelect = card.querySelector('.status-select-mini');
    statusSelect.addEventListener('click', e=>e.stopPropagation());
    statusSelect.addEventListener('change', async e=>{await updateProjectStatus(project.id, e.target.value)});
    const renameBtn = card.querySelector('[data-action="rename"]');
    renameBtn.addEventListener('click', async e=>{
      e.stopPropagation();e.preventDefault();
      openRenameModal(project.id, renameBtn.dataset.name);
    });
    const deleteBtn = card.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', async e=>{
      e.stopPropagation();e.preventDefault();
      if (confirm('Excluir projeto?')) await deleteProject(project.id);
    });
    grid.appendChild(card);
  });
  const add = document.createElement('div');
  add.className = 'card add';
  add.innerHTML = `<i class="fa-solid fa-plus"></i> Novo Projeto`;
  add.addEventListener('click', openCreateModal);
  grid.appendChild(add);
}

function renderTable(projectsToRender){
  tbody.innerHTML = '';
  if (!projectsToRender || projectsToRender.length===0){
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">Nenhum projeto</td></tr>`;
    return;
  }
  projectsToRender.forEach(project=>{
    const status = project.status || 'rascunho';
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><a href="index.html?id=${project.id}" style="color:inherit;text-decoration:none">${project.name || 'Projeto'}</a></td>
        <td>—</td>
        <td><span class="status ${status}">${status}</span></td>
        <td>${project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '—'}</td>
        <td>${project.created_at ? new Date(project.created_at).toLocaleDateString() : '—'}</td>
        <td>
            <button class="mini-btn" data-action="rename" data-id="${project.id}" data-name="${project.name}"><i class="fa-solid fa-pen"></i></button>
            <button class="mini-btn" data-action="delete" data-id="${project.id}"><i class="fa-solid fa-trash"></i></button>
            <select class="status-select-mini" data-id="${project.id}">
                <option value="rascunho" ${status==='rascunho'?'selected':''}>Rascunho</option>
                <option value="publicado" ${status==='publicado'?'selected':''}>Publicado</option>
                <option value="finalizado" ${status==='finalizado'?'selected':''}>Finalizado</option>
            </select>
        </td>
    `;
    tbody.appendChild(tr);
    const statusSelect = tr.querySelector('.status-select-mini');
    statusSelect.addEventListener('change', async e=>{await updateProjectStatus(project.id, e.target.value)});
    const renameBtn = tr.querySelector('[data-action="rename"]');
    renameBtn.addEventListener('click', async ()=>{
      openRenameModal(project.id, renameBtn.dataset.name);
    });
    const deleteBtn = tr.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', async ()=>{
      if (confirm('Excluir projeto?')) await deleteProject(project.id);
    });
  });
}

function render(){
  const filtered = filterProjects();
  if (viewMode==='cards'){
    tableWrap.style.display = 'none';
    renderCards(filtered);
  } else {
    tableWrap.style.display = 'block';
    grid.innerHTML = '';
    renderTable(filtered);
  }
}

function filterProjects(){
  const searchTerm = searchInput.value.toLowerCase();
  const monthValue = filterMonth.value;
  const yearValue = filterYear.value;
  const statusValue = filterStatus.value;
  return (allProjects||[]).filter(project=>{
    const matchesSearch = (project.name||'').toLowerCase().includes(searchTerm);
    const matchesMonth = monthValue === "" || project.event_month === parseInt(monthValue);
    const matchesYear = yearValue === "" || project.event_year === parseInt(yearValue);
    const matchesStatus = statusValue === "" || project.status === statusValue;
    return matchesSearch && matchesMonth && matchesYear && matchesStatus;
  });
}
function openCreateModal(){ modal.style.display = 'flex'; }
function closeCreateModal(){ modal.style.display = 'none'; createForm.reset(); }
function openRenameModal(id, currentName){
  renameModal.style.display = 'flex';
  renameForm.dataset.id = String(id);
  renameNameInput.value = currentName || '';
  setTimeout(()=>{ renameNameInput.focus(); renameNameInput.select(); }, 0);
  validateRenameName();
}
function closeRenameModal(){
  renameModal.style.display = 'none';
  renameForm.removeAttribute('data-id');
  renameForm.reset();
  renameError.textContent = '';
  renameNameInput.classList.remove('error');
  confirmRenameBtn.disabled = true;
}
function validateRenameName(){
  const id = renameForm.dataset.id;
  const value = (renameNameInput.value||'').trim();
  let message = '';
  if (value.length < 2){ message = 'Informe pelo menos 2 caracteres'; }
  const dup = (allProjects||[]).some(p => String(p.id)!==String(id) && (p.name||'').trim().toLowerCase()===value.toLowerCase());
  if (!message && dup){ message = 'Já existe um projeto com esse nome'; }
  renameError.textContent = message;
  if (message){
    renameNameInput.classList.add('error');
    confirmRenameBtn.disabled = true;
    return false;
  } else {
    renameNameInput.classList.remove('error');
    confirmRenameBtn.disabled = false;
    return true;
  }
}
renameNameInput.addEventListener('input', validateRenameName);
createForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const name = document.getElementById('project-name').value;
  const client = document.getElementById('project-client').value;
  const type = document.getElementById('project-type').value;
  const notes = document.getElementById('project-notes').value;
  const files = Array.from(document.getElementById('project-assets').files||[]);
  const user = await checkAuth();
  const { data: created, error } = await supabase
    .from('projects')
    .insert([{ name, user_id: user.id }])
    .select();
  if (error){ alert('Erro ao criar projeto: '+error.message); return; }
  const project = created[0];
  try{
    const meta = { client, type, notes };
    await supabase.from('site_settings').insert({ project_id: project.id, setting_name: 'project_meta', setting_value: meta });
  }catch(e){}
  if (files.length){
    try{
      for (const f of files){
        const path = `projects/${project.id}/${Date.now()}-${f.name}`;
        await supabase.storage.from('site-assets').upload(path, f);
      }
    }catch(e){}
  }
  closeCreateModal();
  loadProjects();
});
cancelCreate.addEventListener('click', closeCreateModal);
newProjectBtn.addEventListener('click', openCreateModal);
cancelRename.addEventListener('click', closeRenameModal);
renameForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const id = renameForm.dataset.id;
  const newName = renameNameInput.value.trim();
  if (!id || !newName || !validateRenameName()) { return; }
  await renameProject(id, newName);
  closeRenameModal();
});
viewCardsBtn.addEventListener('click', ()=>{ viewMode='cards'; viewCardsBtn.classList.add('active'); viewTableBtn.classList.remove('active'); render(); });
viewTableBtn.addEventListener('click', ()=>{ viewMode='table'; viewTableBtn.classList.add('active'); viewCardsBtn.classList.remove('active'); render(); });

async function renameProject(id, newName) {
  const { error } = await supabase
    .from('projects')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert('Erro ao renomear: ' + error.message);
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    await logActivity(id, session?.user?.id, 'update', { 
        message: `Projeto renomeado para: ${newName}` 
    });
    loadProjects();
  }
}

async function deleteProject(id) {
  const { error: settingsError } = await supabase
    .from('site_settings')
    .delete()
    .eq('project_id', id);
    
  if (settingsError) {
    alert('Erro ao excluir configurações do projeto: ' + settingsError.message);
    return;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
    
  if (error) {
    alert('Erro ao excluir: ' + error.message);
  } else {
    loadProjects();
  }
}

async function updateProjectStatus(id, newStatus) {
  const { error } = await supabase
    .from('projects')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if ((error.message || '').includes("Could not find the 'status' column")) {
      alert(
        "Seu banco ainda não tem a coluna 'status' (ou o cache de schema do Supabase não atualizou).\n\n" +
        "No Supabase (SQL Editor), execute o arquivo supabase_updates_v2.sql e depois recarregue o schema (o script já inclui isso).\n\n" +
        "Depois recarregue esta página."
      );
      return;
    }
    alert('Erro ao atualizar status: ' + error.message);
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    await logActivity(id, session?.user?.id, 'status_change', { 
        message: `Status alterado para: ${newStatus}`,
        status: newStatus
    });
    loadProjects();
  }
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

async function generateInitialProjects() {
  const user = await checkAuth();
  
  const projectsToCreate = [
    { name: 'Carna Village', user_id: user.id }
  ];

  for (let i = 2; i <= 12; i++) {
    projectsToCreate.push({ name: `Projeto ${i}`, user_id: user.id });
  }

  const { data: newProjects, error } = await supabase
    .from('projects')
    .insert(projectsToCreate)
    .select();

  if (error) {
    alert('Erro ao gerar projetos: ' + error.message);
  } else {
    const carnaProject = newProjects.find(p => p.name === 'Carna Village');
    if (carnaProject) {
      try {
        const response = await fetch('../config/config.json');
        const defaultConfig = await response.json();
        
        await supabase
          .from('site_settings')
          .insert({
            project_id: carnaProject.id,
            setting_name: 'main_config',
            setting_value: defaultConfig
          });
      } catch (e) {
        console.error('Erro ao inicializar config do Carna Village:', e);
      }
    }
    loadProjects();
  }
}

loadProjects();

