-- ============================================================
-- Equipa (Fase 1): role RH + camadas de permissão + staff (núcleo)
-- ============================================================

-- Novo role: Recursos Humanos
insert into public.roles (key, label_pt, label_en, sort) values
  ('rh','Recursos Humanos','Human Resources',15)
on conflict (key) do update set label_pt=excluded.label_pt, label_en=excluded.label_en;

-- Camadas de acesso sensível (não aparecem na sidebar; só controlam visibilidade)
insert into public.modules (key, label_pt, sort) values
  ('equipa_financeiro','Equipa · Financeiro',20),
  ('equipa_pessoal','Equipa · Pessoal',21),
  ('equipa_notas','Equipa · Notas',22)
on conflict (key) do update set label_pt=excluded.label_pt;

-- Permissões do RH (foco em pessoas)
insert into public.role_permissions (role_key, module_key, level) values
  ('rh','dashboard','view_all'),('rh','calendario','view_all'),('rh','mensagens','view_all'),('rh','definicoes','view_all'),
  ('rh','equipa','edit_all'),('rh','assiduidade','edit_all'),('rh','carreiras','edit_all'),
  ('rh','equipa_financeiro','edit_all'),('rh','equipa_pessoal','edit_all')
on conflict (role_key, module_key) do update set level=excluded.level;

-- Camadas: quem vê o quê
insert into public.role_permissions (role_key, module_key, level) values
  ('administrative','equipa_financeiro','view_all'),
  ('coo','equipa_financeiro','view_all'),('ceo','equipa_financeiro','edit_all'),
  ('coo','equipa_pessoal','view_all'),('ceo','equipa_pessoal','edit_all'),
  ('coo','equipa_notas','edit_all'),('ceo','equipa_notas','edit_all')
on conflict (role_key, module_key) do update set level=excluded.level;

-- Tabela staff (núcleo — sem dados sensíveis, que vêm na Fase 2 em tabelas próprias)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo text,
  email text,
  phone text,
  role text references public.roles(key),          -- função (role de acesso)
  cargo text,                                       -- título livre
  department text default 'construcao' check (department in ('gestao','administracao','orcamentacao','compras','vendas','construcao','outro')),
  status text not null default 'ativo' check (status in ('ativo','inativo','licenca')),
  hire_date date,
  end_date date,
  contract_type text check (contract_type in ('efetivo','termo_certo','termo_incerto','recibos_verdes','temporario')),
  driving_licence text[] not null default '{}',
  skills text[] not null default '{}',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists staff_name_idx on public.staff (name);
create index if not exists staff_department_idx on public.staff (department);

alter table public.staff enable row level security;

-- Ver: quem tem o módulo Equipa OU a própria pessoa (folha ligada à sua conta)
drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff for select to authenticated using (
  public.has_perm('equipa', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.entity_type = 'staff' and p.entity_id = staff.id)
);
drop policy if exists staff_insert on public.staff;
create policy staff_insert on public.staff for insert to authenticated with check (public.has_perm('equipa', true));
drop policy if exists staff_update on public.staff;
create policy staff_update on public.staff for update to authenticated using (public.has_perm('equipa', true)) with check (public.has_perm('equipa', true));
drop policy if exists staff_delete on public.staff;
create policy staff_delete on public.staff for delete to authenticated using (public.has_perm('equipa', true));
