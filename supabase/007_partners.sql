-- ============================================================
-- Módulo Parceiros: fichas + contactos internos + gating
-- ============================================================

create table if not exists public.partners (
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
  partner_type text,  -- subempreiteiro, consultor, fornecedor, joint_venture, outro
  languages text[] not null default '{}',
  status text not null default 'ativo' check (status in ('potencial','ativo','inativo')),
  incomplete boolean not null default true,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists partners_name_idx on public.partners (name);

create table if not exists public.partner_contacts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists partner_contacts_partner_idx on public.partner_contacts (partner_id);

alter table public.partners enable row level security;
alter table public.partner_contacts enable row level security;

drop policy if exists partners_select on public.partners;
create policy partners_select on public.partners for select to authenticated using (public.has_perm('parceiros', false));
drop policy if exists partners_insert on public.partners;
create policy partners_insert on public.partners for insert to authenticated with check (public.has_perm('parceiros', true));
drop policy if exists partners_update on public.partners;
create policy partners_update on public.partners for update to authenticated using (public.has_perm('parceiros', true)) with check (public.has_perm('parceiros', true));
drop policy if exists partners_delete on public.partners;
create policy partners_delete on public.partners for delete to authenticated using (public.has_perm('parceiros', true));

drop policy if exists partner_contacts_select on public.partner_contacts;
create policy partner_contacts_select on public.partner_contacts for select to authenticated using (public.has_perm('parceiros', false));
drop policy if exists partner_contacts_insert on public.partner_contacts;
create policy partner_contacts_insert on public.partner_contacts for insert to authenticated with check (public.has_perm('parceiros', true));
drop policy if exists partner_contacts_update on public.partner_contacts;
create policy partner_contacts_update on public.partner_contacts for update to authenticated using (public.has_perm('parceiros', true)) with check (public.has_perm('parceiros', true));
drop policy if exists partner_contacts_delete on public.partner_contacts;
create policy partner_contacts_delete on public.partner_contacts for delete to authenticated using (public.has_perm('parceiros', true));
