-- Criar tabela de projetos
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_month integer default 2,
  event_year integer default 2026,
  user_id uuid references auth.users(id)
);

-- Habilitar RLS para projects
alter table public.projects enable row level security;

-- Limpar políticas existentes
drop policy if exists "Projetos são visíveis para todos" on public.projects;
drop policy if exists "Apenas autenticados podem criar projetos" on public.projects;
drop policy if exists "Apenas autenticados podem editar projetos" on public.projects;
drop policy if exists "Apenas autenticados podem deletar projetos" on public.projects;

-- Políticas para projects
create policy "Projetos são visíveis para todos"
  on public.projects for select
  using ( true );

create policy "Apenas autenticados podem criar projetos"
  on public.projects for insert
  with check ( auth.role() = 'authenticated' );

create policy "Apenas autenticados podem editar projetos"
  on public.projects for update
  using ( auth.role() = 'authenticated' );

create policy "Apenas autenticados podem deletar projetos"
  on public.projects for delete
  using ( auth.role() = 'authenticated' );

-- Adicionar project_id em site_settings
alter table public.site_settings
add column if not exists project_id uuid references public.projects(id);

alter table public.site_settings
drop constraint if exists site_settings_project_id_fkey;

alter table public.site_settings
add constraint site_settings_project_id_fkey
foreign key (project_id)
references public.projects(id)
on delete cascade;

-- Remover unique constraint antiga de setting_name se existir
alter table public.site_settings
drop constraint if exists site_settings_setting_name_key;

-- Adicionar constraint composta para garantir unicidade por projeto
alter table public.site_settings
drop constraint if exists site_settings_project_id_setting_name_key;

alter table public.site_settings
add constraint site_settings_project_id_setting_name_key unique (project_id, setting_name);
