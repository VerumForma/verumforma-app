-- ============================================================
-- Código interno dos materiais (MS001, MS002…) + IDs externos por fornecedor
-- ============================================================
alter table public.materials add column if not exists code text;

create sequence if not exists public.materials_code_seq;

-- Backfill dos existentes por ordem de criação
do $$
declare r record;
begin
  for r in select id from public.materials where code is null order by created_at loop
    update public.materials set code = 'MS' || lpad(nextval('public.materials_code_seq')::text, 3, '0') where id = r.id;
  end loop;
end $$;

create or replace function public.materials_set_code() returns trigger language plpgsql as $$
begin
  if new.code is null then
    new.code := 'MS' || lpad(nextval('public.materials_code_seq')::text, 3, '0');
  end if;
  return new;
end $$;
drop trigger if exists materials_code_trg on public.materials;
create trigger materials_code_trg before insert on public.materials for each row execute function public.materials_set_code();
create unique index if not exists materials_code_uidx on public.materials (code);

-- IDs externos: ref do fornecedor -> material interno
create table if not exists public.material_external_refs (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  external_ref text not null,
  created_at timestamptz not null default now()
);
create index if not exists mat_ext_refs_material_idx on public.material_external_refs (material_id);
create index if not exists mat_ext_refs_lookup_idx on public.material_external_refs (external_ref);

alter table public.material_external_refs enable row level security;
drop policy if exists mat_ext_refs_select on public.material_external_refs;
create policy mat_ext_refs_select on public.material_external_refs for select to authenticated
  using (public.has_perm('materiais', false) or public.has_perm('financas', false));
drop policy if exists mat_ext_refs_write on public.material_external_refs;
create policy mat_ext_refs_write on public.material_external_refs for all to authenticated
  using (public.has_perm('materiais', true) or public.has_perm('financas', true))
  with check (public.has_perm('materiais', true) or public.has_perm('financas', true));
