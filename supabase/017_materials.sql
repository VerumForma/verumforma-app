-- ============================================================
-- Materiais (Fase A): materiais simples + mão de obra, com histórico de preços
-- Gating pelo módulo 'materiais'
-- ============================================================

-- Materiais simples (raw)
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text not null default 'un' check (unit in ('un','m','m2','m3','ml','kg','saco','l','hora','vg')),
  current_price numeric,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists materials_name_idx on public.materials (name);
create index if not exists materials_category_idx on public.materials (category);

-- Histórico de preços dos materiais (alimentado por faturas no futuro)
create table if not exists public.material_prices (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  price numeric not null,
  price_date date not null default current_date,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);
create index if not exists material_prices_material_idx on public.material_prices (material_id);

-- Mão de obra (catálogo)
create table if not exists public.labour (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hourly_cost numeric,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists labour_name_idx on public.labour (name);

create table if not exists public.labour_prices (
  id uuid primary key default gen_random_uuid(),
  labour_id uuid not null references public.labour(id) on delete cascade,
  hourly_cost numeric not null,
  price_date date not null default current_date,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);
create index if not exists labour_prices_labour_idx on public.labour_prices (labour_id);

alter table public.materials enable row level security;
alter table public.material_prices enable row level security;
alter table public.labour enable row level security;
alter table public.labour_prices enable row level security;

do $$
declare t text;
begin
  foreach t in array array['materials','material_prices','labour','labour_prices'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.has_perm(''materiais'', false))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.has_perm(''materiais'', true)) with check (public.has_perm(''materiais'', true))', t, t);
  end loop;
end $$;
