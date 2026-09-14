-- Preferências de ordenação das tabelas, por utilizador (segue o user em qualquer dispositivo)
create table if not exists public.user_table_prefs (
  user_id uuid not null references auth.users(id) on delete cascade,
  table_key text not null,
  sort_key text not null,
  sort_dir text not null default 'asc' check (sort_dir in ('asc','desc')),
  updated_at timestamptz not null default now(),
  primary key (user_id, table_key)
);
alter table public.user_table_prefs enable row level security;
drop policy if exists user_table_prefs_rw on public.user_table_prefs;
create policy user_table_prefs_rw on public.user_table_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
