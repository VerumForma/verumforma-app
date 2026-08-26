-- Materiais: unidades alternativas por material (conversões) + unidade escolhida na composição
create table if not exists public.material_units (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  label text not null,
  per_base numeric not null default 1,   -- quantas destas unidades há em 1 unidade base
  created_at timestamptz not null default now()
);
create index if not exists material_units_material_idx on public.material_units (material_id);
alter table public.material_units enable row level security;
drop policy if exists material_units_select on public.material_units;
create policy material_units_select on public.material_units for select to authenticated using (public.has_perm('materiais', false));
drop policy if exists material_units_write on public.material_units;
create policy material_units_write on public.material_units for all to authenticated using (public.has_perm('materiais', true)) with check (public.has_perm('materiais', true));

alter table public.composite_items add column if not exists unit text;
