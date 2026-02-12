-- Cria a tabela para armazenar as configurações do site
create table if not exists public.site_settings (
  id uuid default gen_random_uuid() primary key,
  setting_name text not null,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita Row Level Security (RLS)
alter table public.site_settings enable row level security;

-- Limpar políticas existentes para evitar erro de duplicidade
drop policy if exists "Configurações são públicas" on public.site_settings;
drop policy if exists "Apenas admin pode modificar configurações" on public.site_settings;

-- Cria política para permitir leitura pública (qualquer um pode ler as configurações)
create policy "Configurações são públicas"
  on public.site_settings for select
  using ( true );

-- Cria política para permitir que apenas usuários autenticados (admin) possam modificar
create policy "Apenas admin pode modificar configurações"
  on public.site_settings for all
  using ( auth.role() = 'authenticated' );

-- Cria o bucket de storage para imagens se não existir
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- Limpar políticas de storage existentes
drop policy if exists "Imagens são públicas" on storage.objects;
drop policy if exists "Apenas admin pode fazer upload" on storage.objects;
drop policy if exists "Apenas admin pode alterar imagens" on storage.objects;
drop policy if exists "Apenas admin pode deletar imagens" on storage.objects;

-- Política de storage: leitura pública
create policy "Imagens são públicas"
  on storage.objects for select
  using ( bucket_id = 'site-assets' );

-- Política de storage: upload apenas para autenticados
create policy "Apenas admin pode fazer upload"
  on storage.objects for insert
  with check ( bucket_id = 'site-assets' and auth.role() = 'authenticated' );

-- Política de storage: update/delete apenas para autenticados
create policy "Apenas admin pode alterar imagens"
  on storage.objects for update
  using ( bucket_id = 'site-assets' and auth.role() = 'authenticated' );

create policy "Apenas admin pode deletar imagens"
  on storage.objects for delete
  using ( bucket_id = 'site-assets' and auth.role() = 'authenticated' );
