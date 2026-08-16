-- ============================================================
-- Módulo Clientes: fichas + gating via matriz de permissões
-- ============================================================

-- Helper: o utilizador atual tem acesso a um módulo?
create or replace function public.has_perm(p_module text, p_edit boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role_key = pr.role
    where pr.id = auth.uid()
      and rp.module_key = p_module
      and case when p_edit then rp.level in ('edit_assigned','edit_all')
               else rp.level <> 'none' end
  );
$$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'individual' check (kind in ('empresa','individual')),
  name text not null,
  company text,
  nif text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  status text not null default 'potencial' check (status in ('potencial','ativo','inativo')),
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists clients_name_idx on public.clients (name);
create index if not exists clients_status_idx on public.clients (status);

alter table public.clients enable row level security;

drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select to authenticated using (public.has_perm('clientes', false));

drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients
  for insert to authenticated with check (public.has_perm('clientes', true));

drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients
  for update to authenticated using (public.has_perm('clientes', true))
  with check (public.has_perm('clientes', true));

drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients
  for delete to authenticated using (public.has_perm('clientes', true));
