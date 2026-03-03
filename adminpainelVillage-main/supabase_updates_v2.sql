-- Adicionar coluna de status à tabela de projetos
alter table public.projects 
add column if not exists status text default 'rascunho' check (status in ('rascunho', 'publicado', 'finalizado'));

-- Criar tabela de logs de auditoria (Audit Log)
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.projects(id) on delete cascade,
    user_id uuid references auth.users(id),
    action text not null, -- 'create', 'update', 'delete', 'status_change'
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para logs
alter table public.audit_logs enable row level security;

-- Políticas para logs
create policy "Usuários podem ver logs dos seus projetos"
on public.audit_logs for select
using (
    exists (
        select 1 from public.projects 
        where projects.id = audit_logs.project_id
    )
);

create policy "Sistema pode inserir logs"
on public.audit_logs for insert
with check (true);

notify pgrst, 'reload schema';
