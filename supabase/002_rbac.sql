-- ============================================================
-- RBAC: roles + módulos + matriz de permissões (role × módulo → nível)
-- Níveis: none | view_assigned | view_all | edit_assigned | edit_all
-- ============================================================

-- ---- Roles ----
create table if not exists public.roles (
  key text primary key,
  label_pt text not null,
  label_en text not null,
  is_system boolean not null default true,
  sort int not null default 0
);

insert into public.roles (key, label_pt, label_en, sort) values
  ('unassigned','Visita','Unassigned',0),
  ('client','Cliente','Client',1),
  ('investor','Investidor','Investor',2),
  ('supplier','Fornecedor','Supplier',3),
  ('partner','Parceiro','Partner',4),
  ('painter','Pintor','Painter',5),
  ('carpenter','Carpinteiro','Carpenter',6),
  ('tiler','Ladrilhador','Tiler',7),
  ('mason','Pedreiro','Mason',8),
  ('worker','Servente','Worker',9),
  ('team_leader','Chefe de Equipa','Team Leader',10),
  ('foreman','Encarregado de Obra','Foreman',11),
  ('sales','Vendedor','Sales',12),
  ('procurement','Técnico de Compras','Procurement',13),
  ('estimator','Orçamentista','Estimator',14),
  ('administrative','Administrativo','Administrative',15),
  ('coo','Chefe Operacional','COO',16),
  ('ceo','Chefe Executivo','CEO',17)
on conflict (key) do update set label_pt=excluded.label_pt, label_en=excluded.label_en, sort=excluded.sort;

-- ---- Módulos (cresce à medida que construímos) ----
create table if not exists public.modules (
  key text primary key,
  label_pt text not null,
  sort int not null default 0
);

insert into public.modules (key, label_pt, sort) values
  ('dashboard','Início',0),
  ('calendario','Calendário',1),
  ('tarefas','Tarefas',2),
  ('orcamentos','Orçamentos',3),
  ('clientes','Clientes',4),
  ('projetos','Projetos',5),
  ('mensagens','Mensagens',6),
  ('equipa','Equipa',7),
  ('definicoes','Definições',8),
  ('auditoria','Registos de Auditoria',9),
  ('assiduidade','Assiduidade',10),
  ('fornecedores','Fornecedores',11),
  ('parceiros','Parceiros',12),
  ('financas','Finanças',13),
  ('estatisticas','Estatísticas',14),
  ('investimentos','Investimentos',15),
  ('materiais','Materiais',16),
  ('carreiras','Carreiras',17)
on conflict (key) do update set label_pt=excluded.label_pt, sort=excluded.sort;

-- ---- Matriz de permissões ----
create table if not exists public.role_permissions (
  role_key text not null references public.roles(key) on delete cascade,
  module_key text not null references public.modules(key) on delete cascade,
  level text not null default 'none'
    check (level in ('none','view_assigned','view_all','edit_assigned','edit_all')),
  primary key (role_key, module_key)
);

-- Seed da matriz (transcrito do Base44). Só células com acesso; o resto = none.
insert into public.role_permissions (role_key, module_key, level) values
  -- Externos / visita
  ('unassigned','dashboard','view_assigned'),('unassigned','calendario','view_assigned'),('unassigned','orcamentos','view_assigned'),('unassigned','mensagens','view_assigned'),('unassigned','definicoes','view_assigned'),
  ('client','dashboard','view_assigned'),('client','calendario','view_assigned'),('client','orcamentos','view_assigned'),('client','mensagens','view_assigned'),('client','definicoes','view_assigned'),
  ('investor','dashboard','view_assigned'),('investor','calendario','view_assigned'),('investor','orcamentos','view_assigned'),('investor','projetos','view_assigned'),('investor','mensagens','view_assigned'),('investor','definicoes','view_assigned'),('investor','investimentos','view_assigned'),
  ('supplier','dashboard','view_assigned'),('supplier','calendario','view_assigned'),('supplier','mensagens','view_assigned'),('supplier','definicoes','view_assigned'),('supplier','fornecedores','view_assigned'),
  ('partner','dashboard','view_assigned'),('partner','calendario','view_assigned'),('partner','orcamentos','view_assigned'),('partner','projetos','view_assigned'),('partner','mensagens','view_assigned'),('partner','definicoes','view_assigned'),('partner','parceiros','view_assigned'),
  -- Ofícios (mesma base)
  ('painter','dashboard','view_assigned'),('painter','calendario','view_assigned'),('painter','mensagens','view_assigned'),('painter','definicoes','view_assigned'),('painter','assiduidade','view_assigned'),('painter','carreiras','view_all'),
  ('carpenter','dashboard','view_assigned'),('carpenter','calendario','view_assigned'),('carpenter','mensagens','view_assigned'),('carpenter','definicoes','view_assigned'),('carpenter','assiduidade','view_assigned'),('carpenter','carreiras','view_all'),
  ('tiler','dashboard','view_assigned'),('tiler','calendario','view_assigned'),('tiler','mensagens','view_assigned'),('tiler','definicoes','view_assigned'),('tiler','assiduidade','view_assigned'),('tiler','carreiras','view_all'),
  ('mason','dashboard','view_assigned'),('mason','calendario','view_assigned'),('mason','mensagens','view_assigned'),('mason','definicoes','view_assigned'),('mason','assiduidade','view_assigned'),('mason','carreiras','view_all'),
  ('worker','dashboard','view_assigned'),('worker','calendario','view_assigned'),('worker','mensagens','view_assigned'),('worker','definicoes','view_assigned'),('worker','assiduidade','view_assigned'),('worker','carreiras','view_all'),
  -- Chefias de campo
  ('team_leader','dashboard','view_assigned'),('team_leader','calendario','view_assigned'),('team_leader','mensagens','view_assigned'),('team_leader','equipa','edit_assigned'),('team_leader','definicoes','view_assigned'),('team_leader','assiduidade','edit_assigned'),('team_leader','carreiras','view_all'),
  ('foreman','dashboard','view_assigned'),('foreman','calendario','view_assigned'),('foreman','projetos','view_assigned'),('foreman','mensagens','view_assigned'),('foreman','equipa','edit_assigned'),('foreman','definicoes','view_assigned'),('foreman','assiduidade','edit_assigned'),('foreman','fornecedores','view_assigned'),('foreman','parceiros','view_assigned'),('foreman','carreiras','view_all'),
  -- Escritório
  ('sales','dashboard','view_assigned'),('sales','calendario','view_assigned'),('sales','tarefas','view_all'),('sales','orcamentos','view_all'),('sales','clientes','edit_all'),('sales','projetos','view_all'),('sales','mensagens','view_assigned'),('sales','equipa','view_all'),('sales','definicoes','view_assigned'),('sales','assiduidade','view_assigned'),('sales','fornecedores','view_all'),('sales','parceiros','view_all'),('sales','financas','view_all'),('sales','estatisticas','view_assigned'),('sales','materiais','view_all'),('sales','carreiras','view_all'),
  ('procurement','dashboard','view_assigned'),('procurement','calendario','view_assigned'),('procurement','tarefas','view_all'),('procurement','orcamentos','view_all'),('procurement','clientes','view_all'),('procurement','projetos','view_all'),('procurement','mensagens','view_assigned'),('procurement','equipa','view_all'),('procurement','definicoes','view_assigned'),('procurement','assiduidade','view_assigned'),('procurement','fornecedores','edit_all'),('procurement','parceiros','view_all'),('procurement','financas','edit_all'),('procurement','estatisticas','view_assigned'),('procurement','materiais','edit_all'),('procurement','carreiras','view_all'),
  ('estimator','dashboard','view_assigned'),('estimator','calendario','view_assigned'),('estimator','tarefas','view_all'),('estimator','orcamentos','edit_all'),('estimator','clientes','view_all'),('estimator','projetos','view_all'),('estimator','mensagens','view_assigned'),('estimator','equipa','view_all'),('estimator','definicoes','view_assigned'),('estimator','assiduidade','view_assigned'),('estimator','fornecedores','view_all'),('estimator','parceiros','view_all'),('estimator','financas','view_all'),('estimator','estatisticas','view_assigned'),('estimator','materiais','view_all'),('estimator','carreiras','view_all'),
  ('administrative','dashboard','view_assigned'),('administrative','calendario','view_assigned'),('administrative','tarefas','view_all'),('administrative','orcamentos','view_all'),('administrative','clientes','view_all'),('administrative','projetos','view_all'),('administrative','mensagens','view_assigned'),('administrative','equipa','view_all'),('administrative','definicoes','view_assigned'),('administrative','assiduidade','view_all'),('administrative','fornecedores','view_all'),('administrative','parceiros','view_all'),('administrative','financas','edit_all'),('administrative','estatisticas','view_all'),('administrative','investimentos','view_all'),('administrative','materiais','view_all'),('administrative','carreiras','view_all'),
  -- Exec
  ('coo','dashboard','view_all'),('coo','calendario','view_all'),('coo','tarefas','view_all'),('coo','orcamentos','view_all'),('coo','clientes','view_all'),('coo','projetos','view_all'),('coo','mensagens','view_all'),('coo','equipa','view_all'),('coo','definicoes','view_all'),('coo','auditoria','view_all'),('coo','assiduidade','view_all'),('coo','fornecedores','view_all'),('coo','parceiros','view_all'),('coo','financas','edit_all'),('coo','estatisticas','view_all'),('coo','investimentos','view_all'),('coo','materiais','view_all'),('coo','carreiras','view_all'),
  ('ceo','dashboard','edit_all'),('ceo','calendario','edit_all'),('ceo','tarefas','edit_all'),('ceo','orcamentos','edit_all'),('ceo','clientes','edit_all'),('ceo','projetos','edit_all'),('ceo','mensagens','edit_all'),('ceo','equipa','edit_all'),('ceo','definicoes','edit_all'),('ceo','auditoria','edit_all'),('ceo','assiduidade','edit_all'),('ceo','fornecedores','edit_all'),('ceo','parceiros','edit_all'),('ceo','financas','edit_all'),('ceo','estatisticas','edit_all'),('ceo','investimentos','edit_all'),('ceo','materiais','edit_all'),('ceo','carreiras','edit_all')
on conflict (role_key, module_key) do update set level = excluded.level;

-- ---- profiles: role (FK) + ligação a entidade ----
alter table public.profiles add column if not exists entity_type text;
alter table public.profiles add column if not exists entity_id uuid;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles alter column role set default 'unassigned';
-- valores legados (admin/staff de 001) → ceo, para não perder acesso
update public.profiles set role = 'ceo' where role not in (select key from public.roles);
alter table public.profiles drop constraint if exists profiles_role_fkey;
alter table public.profiles add constraint profiles_role_fkey foreign key (role) references public.roles(key);

-- ---- RLS: qualquer autenticado pode LER roles/módulos/permissões ----
alter table public.roles enable row level security;
alter table public.modules enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles for select to authenticated using (true);
drop policy if exists modules_read on public.modules;
create policy modules_read on public.modules for select to authenticated using (true);
drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);
