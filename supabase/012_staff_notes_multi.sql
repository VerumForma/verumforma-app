-- Notas do gestor passam a ser várias (sticky notes) por membro
drop table if exists public.staff_notes cascade;
create table public.staff_notes (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  content text not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists staff_notes_staff_idx on public.staff_notes (staff_id);
alter table public.staff_notes enable row level security;
drop policy if exists staff_notes_select on public.staff_notes;
create policy staff_notes_select on public.staff_notes for select to authenticated using (public.has_perm('equipa_notas', false));
drop policy if exists staff_notes_write on public.staff_notes;
create policy staff_notes_write on public.staff_notes for all to authenticated
  using (public.has_perm('equipa_notas', true)) with check (public.has_perm('equipa_notas', true));
