-- ============================================================
-- Módulo Fornecedores: fichas + contactos internos + gating
-- ============================================================

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'empresa' check (kind in ('empresa','individual')),
  name text not null,
  company text,
  nif text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  website text,
  supplies text[] not null default '{}',      -- materiais, mao_obra, servicos, equipamento
  labour_type text,                            -- especifica o tipo de mão de obra
  languages text[] not null default '{}',
  status text not null default 'ativo' check (status in ('potencial','ativo','inativo')),
  incomplete boolean not null default true,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists suppliers_name_idx on public.suppliers (name);
create index if not exists suppliers_status_idx on public.suppliers (status);

create table if not exists public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists supplier_contacts_supplier_idx on public.supplier_contacts (supplier_id);

alter table public.suppliers enable row level security;
alter table public.supplier_contacts enable row level security;

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers for select to authenticated using (public.has_perm('fornecedores', false));
drop policy if exists suppliers_insert on public.suppliers;
create policy suppliers_insert on public.suppliers for insert to authenticated with check (public.has_perm('fornecedores', true));
drop policy if exists suppliers_update on public.suppliers;
create policy suppliers_update on public.suppliers for update to authenticated using (public.has_perm('fornecedores', true)) with check (public.has_perm('fornecedores', true));
drop policy if exists suppliers_delete on public.suppliers;
create policy suppliers_delete on public.suppliers for delete to authenticated using (public.has_perm('fornecedores', true));

drop policy if exists supplier_contacts_select on public.supplier_contacts;
create policy supplier_contacts_select on public.supplier_contacts for select to authenticated using (public.has_perm('fornecedores', false));
drop policy if exists supplier_contacts_insert on public.supplier_contacts;
create policy supplier_contacts_insert on public.supplier_contacts for insert to authenticated with check (public.has_perm('fornecedores', true));
drop policy if exists supplier_contacts_update on public.supplier_contacts;
create policy supplier_contacts_update on public.supplier_contacts for update to authenticated using (public.has_perm('fornecedores', true)) with check (public.has_perm('fornecedores', true));
drop policy if exists supplier_contacts_delete on public.supplier_contacts;
create policy supplier_contacts_delete on public.supplier_contacts for delete to authenticated using (public.has_perm('fornecedores', true));
