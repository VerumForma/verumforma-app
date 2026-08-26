-- ============================================================
-- Equipa (Fase 2): dados sensíveis em tabelas próprias, cada uma
-- protegida pela sua camada de permissão (+ a própria pessoa).
-- ============================================================

-- self helper inline: a folha está ligada à conta do utilizador atual?
-- (usado nas policies abaixo)

-- ---- Pessoal (camada equipa_pessoal) ----
create table if not exists public.staff_personal (
  staff_id uuid primary key references public.staff(id) on delete cascade,
  birth_date date,
  nif text,
  niss text,
  address text
);
alter table public.staff_personal enable row level security;
drop policy if exists staff_personal_select on public.staff_personal;
create policy staff_personal_select on public.staff_personal for select to authenticated using (
  public.has_perm('equipa_pessoal', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.entity_type = 'staff' and p.entity_id = staff_personal.staff_id)
);
drop policy if exists staff_personal_write on public.staff_personal;
create policy staff_personal_write on public.staff_personal for all to authenticated
  using (public.has_perm('equipa_pessoal', true)) with check (public.has_perm('equipa_pessoal', true));

-- ---- Financeiro (camada equipa_financeiro) ----
create table if not exists public.staff_finance (
  staff_id uuid primary key references public.staff(id) on delete cascade,
  salary numeric,
  currency text not null default 'EUR',
  iban text
);
alter table public.staff_finance enable row level security;
drop policy if exists staff_finance_select on public.staff_finance;
create policy staff_finance_select on public.staff_finance for select to authenticated using (
  public.has_perm('equipa_financeiro', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.entity_type = 'staff' and p.entity_id = staff_finance.staff_id)
);
drop policy if exists staff_finance_write on public.staff_finance;
create policy staff_finance_write on public.staff_finance for all to authenticated
  using (public.has_perm('equipa_financeiro', true)) with check (public.has_perm('equipa_financeiro', true));

-- ---- Notas do gestor (camada equipa_notas — SEM self) ----
create table if not exists public.staff_notes (
  staff_id uuid primary key references public.staff(id) on delete cascade,
  notes text
);
alter table public.staff_notes enable row level security;
drop policy if exists staff_notes_select on public.staff_notes;
create policy staff_notes_select on public.staff_notes for select to authenticated using (public.has_perm('equipa_notas', false));
drop policy if exists staff_notes_write on public.staff_notes;
create policy staff_notes_write on public.staff_notes for all to authenticated
  using (public.has_perm('equipa_notas', true)) with check (public.has_perm('equipa_notas', true));

-- ---- Certificações (camada equipa_pessoal) ----
create table if not exists public.staff_certifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  name text not null,
  issuer text,
  issue_date date,
  expiry_date date,
  number text,
  created_at timestamptz not null default now()
);
create index if not exists staff_cert_staff_idx on public.staff_certifications (staff_id);
alter table public.staff_certifications enable row level security;
drop policy if exists staff_cert_select on public.staff_certifications;
create policy staff_cert_select on public.staff_certifications for select to authenticated using (
  public.has_perm('equipa_pessoal', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.entity_type = 'staff' and p.entity_id = staff_certifications.staff_id)
);
drop policy if exists staff_cert_write on public.staff_certifications;
create policy staff_cert_write on public.staff_certifications for all to authenticated
  using (public.has_perm('equipa_pessoal', true)) with check (public.has_perm('equipa_pessoal', true));

-- ---- Família / aniversários (camada equipa_pessoal) ----
create table if not exists public.staff_family (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  relation text not null default 'outro' check (relation in ('conjuge','filho','outro')),
  name text not null,
  birthday date,
  phone text,
  is_emergency boolean not null default false,
  gift_amount numeric,
  created_at timestamptz not null default now()
);
create index if not exists staff_family_staff_idx on public.staff_family (staff_id);
alter table public.staff_family enable row level security;
drop policy if exists staff_family_select on public.staff_family;
create policy staff_family_select on public.staff_family for select to authenticated using (
  public.has_perm('equipa_pessoal', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.entity_type = 'staff' and p.entity_id = staff_family.staff_id)
);
drop policy if exists staff_family_write on public.staff_family;
create policy staff_family_write on public.staff_family for all to authenticated
  using (public.has_perm('equipa_pessoal', true)) with check (public.has_perm('equipa_pessoal', true));
