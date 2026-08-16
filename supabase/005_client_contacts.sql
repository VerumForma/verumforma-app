-- Clientes: website + contactos internos (pessoas dentro da empresa)
alter table public.clients add column if not exists website text;

create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists client_contacts_client_idx on public.client_contacts (client_id);

alter table public.client_contacts enable row level security;

drop policy if exists client_contacts_select on public.client_contacts;
create policy client_contacts_select on public.client_contacts
  for select to authenticated using (public.has_perm('clientes', false));

drop policy if exists client_contacts_insert on public.client_contacts;
create policy client_contacts_insert on public.client_contacts
  for insert to authenticated with check (public.has_perm('clientes', true));

drop policy if exists client_contacts_update on public.client_contacts;
create policy client_contacts_update on public.client_contacts
  for update to authenticated using (public.has_perm('clientes', true))
  with check (public.has_perm('clientes', true));

drop policy if exists client_contacts_delete on public.client_contacts;
create policy client_contacts_delete on public.client_contacts
  for delete to authenticated using (public.has_perm('clientes', true));
