-- 1. Criar a tabela de perfis (garantindo que existe)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'editor',
  updated_at timestamp with time zone default now()
);

-- 2. Habilitar RLS
alter table public.profiles enable row level security;

-- 3. Limpar políticas
drop policy if exists "Perfis são visíveis por todos" on public.profiles;
drop policy if exists "Usuários podem editar seu próprio perfil" on public.profiles;

create policy "Perfis são visíveis por todos" on public.profiles for select using (true);
create policy "Usuários podem editar seu próprio perfil" on public.profiles for update using (auth.uid() = id);

-- 4. FUNÇÃO CORRIGIDA (com tratamento de erro para não travar a criação do usuário)
create or replace function public.handle_new_user()
returns trigger 
security definer set search_path = public
language plpgsql
as $$
begin
  begin
    insert into public.profiles (id, email, full_name)
    values (
      new.id, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'full_name', '')
    );
  exception when others then
    -- Se der erro ao criar o perfil, o usuário na Auth ainda será criado
    return new;
  end;
  return new;
end;
$$;

-- 5. TRIGGER (Recriar)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Notificar cache
notify pgrst, 'reload schema';
