
/**
 * SCRIPT DE SINCRONIZAÇÃO DE LAYOUT E ESTILO
 * 
 * Este script copia as configurações de ESTRUTURA, TAMANHO e CORES GLOBAIS
 * do projeto "Carna Village" para todos os outros projetos.
 * 
 * Mantém intactas as configurações de CONTEÚDO específico:
 * - Imagens (URLs)
 * - Textos
 * - Vídeos
 * - Preços
 * - Agenda (datas)
 * - FAQ
 * 
 * Sincroniza:
 * - Fontes (Família, Tamanhos e Cores de Texto)
 * - Cores Globais (Backgrounds, Botões)
 * - Espessura e Cores de Bordas (Frames)
 * - Posicionamento de elementos (Variables)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://luzsdqmqnwjwgssubgsa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enNkcW1xbndqd2dzc3ViZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzY0MTYsImV4cCI6MjA4NjMxMjQxNn0.xqHESzNSL776PLlPzfjPAu1I-VimMfM6Icp8v3VHX1s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncLayout() {
  console.log('Starting layout sync...');

  // 1. Find Source Project (Carnaval)
  const { data: sourceProjects } = await supabase
    .from('projects')
    .select('id, name')
    .ilike('name', '%Carna%')
    .limit(1);

  if (!sourceProjects || sourceProjects.length === 0) {
    console.error('Source project (Carnaval) not found.');
    return;
  }

  const sourceId = sourceProjects[0].id;
  console.log(`Source Project: ${sourceProjects[0].name} (${sourceId})`);

  // 2. Fetch Source Config
  const { data: sourceSettings } = await supabase
    .from('site_settings')
    .select('setting_value')
    .eq('project_id', sourceId)
    .eq('setting_name', 'main_config')
    .single();

  if (!sourceSettings || !sourceSettings.setting_value) {
    console.error('Source config not found.');
    return;
  }

  const sourceConfig = sourceSettings.setting_value;

  // 3. Fetch All Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name');

  console.log(`Found ${projects.length} projects to check.`);

  // 4. Update Each Project
  for (const project of projects) {
    if (project.id === sourceId) continue;

    console.log(`Processing: ${project.name}...`);

    // Fetch Target Config
    const { data: targetSettings } = await supabase
      .from('site_settings')
      .select('id, setting_value')
      .eq('project_id', project.id)
      .eq('setting_name', 'main_config')
      .single();

    if (!targetSettings) {
      console.log(`  - No config found, skipping (or should create full copy?).`);
      continue;
    }

    let targetConfig = targetSettings.setting_value || {};
    let modified = false;

    // --- SYNC LOGIC START ---

    // 1. Typography (Fonts, Sizes, AND COLORS)
    if (sourceConfig.typography) {
      if (!targetConfig.typography) targetConfig.typography = {};
      
      // Sync ALL typography settings (includes font families, sizes, and specific text colors)
      // This matches user request: "tamanhos de fonte, cores e variações"
      Object.keys(sourceConfig.typography).forEach(key => {
        if (sourceConfig.typography[key] !== targetConfig.typography[key]) {
          targetConfig.typography[key] = sourceConfig.typography[key];
          modified = true;
        }
      });
    }

    // 2. Global Colors (Backgrounds, Buttons)
    if (sourceConfig.colors) {
      if (!targetConfig.colors) targetConfig.colors = {};

      // Sync ALL global colors
      Object.keys(sourceConfig.colors).forEach(key => {
        if (sourceConfig.colors[key] !== targetConfig.colors[key]) {
          targetConfig.colors[key] = sourceConfig.colors[key];
          modified = true;
        }
      });
    }

    // 3. Frames (Borders)
    if (sourceConfig.frames) {
      if (!targetConfig.frames) targetConfig.frames = {};
      
      // Sync ALL frame settings (width AND color)
      Object.keys(sourceConfig.frames).forEach(key => {
        if (sourceConfig.frames[key] !== targetConfig.frames[key]) {
          targetConfig.frames[key] = sourceConfig.frames[key];
          modified = true;
        }
      });
    }

    // 4. Variables (Positioning & Visibility)
    if (sourceConfig.variables) {
      if (!targetConfig.variables) targetConfig.variables = {};
      
      // Programacoes / ProgramacaoInfantil
      const progKey = sourceConfig.variables.programacoes ? 'programacoes' : 'programacaoInfantil';
      const targetProgKey = targetConfig.variables.programacoes ? 'programacoes' : 'programacaoInfantil';
      
      if (sourceConfig.variables[progKey] && targetConfig.variables[targetProgKey]) {
        // Sync Position
        if (sourceConfig.variables[progKey].position !== targetConfig.variables[targetProgKey].position) {
            targetConfig.variables[targetProgKey].position = sourceConfig.variables[progKey].position;
            modified = true;
        }
        // Sync Enabled state? User said "structure", enabled state affects structure (visibility).
        if (sourceConfig.variables[progKey].enabled !== targetConfig.variables[targetProgKey].enabled) {
            targetConfig.variables[targetProgKey].enabled = sourceConfig.variables[progKey].enabled;
            modified = true;
        }
      }
    }

    // --- SYNC LOGIC END ---

    if (modified) {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: targetConfig })
        .eq('id', targetSettings.id);

      if (error) {
        console.error(`  - Error updating: ${error.message}`);
      } else {
        console.log(`  - Updated successfully.`);
      }
    } else {
      console.log(`  - No layout changes needed.`);
    }
  }

  console.log('Layout sync complete.');
}

syncLayout();
