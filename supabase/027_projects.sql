-- ============================================================
-- Módulo Projetos (obras) — ligado a Clientes, Finanças (despesas/recibos)
-- Gating pelo módulo 'projetos' (já registado em 002_rbac.sql)
-- ============================================================

insert into public.modules (key, label_pt, sort) values ('projetos','Projetos',5)
on conflict (key) do update set label_pt = excluded.label_pt;

-- ---- PROJETOS (obras) ----
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text,                                          -- PRJ001, PRJ002…
  name text not null,
  client_id uuid references public.clients(id) on delete set null,
  manager_id uuid references public.staff(id) on delete set null,   -- responsável
  status text not null default 'adjudicado'
    check (status in ('adjudicado','em_curso','pausado','concluido','cancelado')),
  address text,
  city text,
  start_date date,                                    -- início
  end_date date,                                      -- prazo previsto
  completed_date date,                                -- conclusão real
  budget numeric,                                     -- valor adjudicado (c/ IVA)
  description text,
  incomplete boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists projects_client_idx on public.projects (client_id);
create index if not exists projects_status_idx on public.projects (status);

-- Código interno sequencial (PRJ001…)
create sequence if not exists public.projects_code_seq;
do $$
declare r record;
begin
  for r in select id from public.projects where code is null order by created_at loop
    update public.projects set code = 'PRJ' || lpad(nextval('public.projects_code_seq')::text, 3, '0') where id = r.id;
  end loop;
end $$;
create or replace function public.projects_set_code() returns trigger language plpgsql as $$
begin
  if new.code is null then
    new.code := 'PRJ' || lpad(nextval('public.projects_code_seq')::text, 3, '0');
  end if;
  return new;
end $$;
drop trigger if exists projects_code_trg on public.projects;
create trigger projects_code_trg before insert on public.projects for each row execute function public.projects_set_code();
create unique index if not exists projects_code_uidx on public.projects (code);

-- ---- Ligar project_id das Finanças a projects (colunas já existem em 021) ----
create index if not exists expenses_project_idx on public.expenses (project_id);
create index if not exists receipts_project_idx on public.receipts (project_id);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_project_fk') then
    alter table public.expenses add constraint expenses_project_fk
      foreign key (project_id) references public.projects(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'receipts_project_fk') then
    alter table public.receipts add constraint receipts_project_fk
      foreign key (project_id) references public.projects(id) on delete set null;
  end if;
end $$;

-- ---- RLS: tudo pelo módulo 'projetos' ----
alter table public.projects enable row level security;
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated
  using (public.has_perm('projetos', false));
drop policy if exists projects_write on public.projects;
create policy projects_write on public.projects for all to authenticated
  using (public.has_perm('projetos', true))
  with check (public.has_perm('projetos', true));
