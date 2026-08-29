-- ============================================================
-- Módulo Finanças (Faturação): três livros — Despesas, Recibos, Vencimentos
-- Gating pelo módulo 'financas' (já registado em 002_rbac.sql)
-- ============================================================

-- Garantir que o módulo existe / label correto
insert into public.modules (key, label_pt, sort) values ('financas','Finanças',13)
on conflict (key) do update set label_pt = excluded.label_pt;

-- ---- Categorias de despesa (partilhadas por despesas e vencimentos) ----
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1',
  internal boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists expense_categories_name_idx on public.expense_categories (name);

-- ---- DESPESAS (faturas de fornecedor / dinheiro que sai) ----
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  project_id uuid,                                   -- preparado para o futuro módulo Projetos
  category_id uuid references public.expense_categories(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','approved','paid','overdue','cancelled')),
  amount numeric not null default 0,                 -- valor TOTAL (com IVA)
  vat_rate numeric not null default 23,              -- taxa de IVA em vigor (23/13/6/0)
  currency text not null default 'EUR',
  reference text,                                     -- nº de fatura / referência
  issue_date date,
  due_date date,
  paid_date date,
  internal boolean not null default false,           -- despesa interna vs. de projeto
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists expenses_supplier_idx on public.expenses (supplier_id);
create index if not exists expenses_status_idx on public.expenses (status);
create index if not exists expenses_issue_idx on public.expenses (issue_date);

-- ---- RECIBOS (faturas a cliente / dinheiro que entra) ----
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Fatura',
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid,
  status text not null default 'issued'
    check (status in ('draft','issued','paid','overdue','cancelled')),
  amount numeric not null default 0,                 -- valor TOTAL (com IVA)
  vat_rate numeric not null default 23,
  currency text not null default 'EUR',
  reference text,
  issue_date date,
  paid_date date,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists receipts_client_idx on public.receipts (client_id);
create index if not exists receipts_status_idx on public.receipts (status);
create index if not exists receipts_issue_idx on public.receipts (issue_date);

-- ---- NOTAS DE CRÉDITO (associadas a um recibo) ----
create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  amount numeric not null default 0,
  reason text,
  issue_date date default current_date,
  created_at timestamptz not null default now()
);
create index if not exists credit_notes_receipt_idx on public.credit_notes (receipt_id);

-- ---- VENCIMENTOS (salários / dinheiro que sai para a equipa) ----
create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff(id) on delete set null,
  period text not null,                              -- ex. '2026-03'
  status text not null default 'draft'
    check (status in ('draft','approved','paid')),
  currency text not null default 'EUR',
  category_id uuid references public.expense_categories(id) on delete set null,
  paid_date date,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists payroll_staff_idx on public.payroll (staff_id);
create index if not exists payroll_period_idx on public.payroll (period);

-- Linhas do vencimento (vencimentos vs. deduções)
create table if not exists public.payroll_lines (
  id uuid primary key default gen_random_uuid(),
  payroll_id uuid not null references public.payroll(id) on delete cascade,
  kind text not null default 'earning'               -- earning soma ao bruto; deduction subtrai
    check (kind in ('earning','deduction')),
  type text not null default 'base_salary',          -- base_salary/bonus/allowance/overtime/irs/ss/other
  description text,
  amount numeric not null default 0,                 -- sempre positivo; kind determina o sinal
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists payroll_lines_payroll_idx on public.payroll_lines (payroll_id);

-- ---- ANEXOS (partilhado pelos três livros) ----
create table if not exists public.finance_attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('expense','receipt','payroll')),
  entity_id uuid not null,
  name text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists finance_attachments_entity_idx on public.finance_attachments (entity_type, entity_id);

-- ============================================================
-- RLS: tudo pelo módulo 'financas'
-- ============================================================
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.receipts enable row level security;
alter table public.credit_notes enable row level security;
alter table public.payroll enable row level security;
alter table public.payroll_lines enable row level security;
alter table public.finance_attachments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['expense_categories','expenses','receipts','credit_notes','payroll','payroll_lines','finance_attachments'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.has_perm(''financas'', false))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.has_perm(''financas'', true)) with check (public.has_perm(''financas'', true))', t, t);
  end loop;
end $$;

-- ============================================================
-- Storage: bucket privado para anexos de faturas/recibos/vencimentos
-- ============================================================
insert into storage.buckets (id, name, public) values ('financas', 'financas', false)
on conflict (id) do nothing;

drop policy if exists financas_read on storage.objects;
create policy financas_read on storage.objects for select to authenticated
  using (bucket_id = 'financas' and public.has_perm('financas', false));
drop policy if exists financas_insert on storage.objects;
create policy financas_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'financas' and public.has_perm('financas', true));
drop policy if exists financas_delete on storage.objects;
create policy financas_delete on storage.objects for delete to authenticated
  using (bucket_id = 'financas' and public.has_perm('financas', true));
