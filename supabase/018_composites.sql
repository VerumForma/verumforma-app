-- ============================================================
-- Materiais compostos (Fase B): artigos com composição
-- ============================================================
create table if not exists public.composites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text not null default 'm2' check (unit in ('un','m','m2','m3','ml','kg','saco','l','hora','vg')),
  waste_pct numeric not null default 0,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists composites_name_idx on public.composites (name);

create table if not exists public.composite_items (
  id uuid primary key default gen_random_uuid(),
  composite_id uuid not null references public.composites(id) on delete cascade,
  kind text not null check (kind in ('material','labour')),
  material_id uuid references public.materials(id) on delete set null,
  labour_id uuid references public.labour(id) on delete set null,
  quantity numeric not null default 0,
  note text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists composite_items_composite_idx on public.composite_items (composite_id);

alter table public.composites enable row level security;
alter table public.composite_items enable row level security;
do $$
declare t text;
begin
  foreach t in array array['composites','composite_items'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.has_perm(''materiais'', false))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.has_perm(''materiais'', true)) with check (public.has_perm(''materiais'', true))', t, t);
  end loop;
end $$;
