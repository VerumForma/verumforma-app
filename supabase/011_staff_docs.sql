-- ============================================================
-- Equipa: CC + morada estruturada + documentos (storage)
-- ============================================================

-- Dados pessoais: cartão de cidadão + morada dividida
alter table public.staff_personal add column if not exists cc text;
alter table public.staff_personal add column if not exists street text;
alter table public.staff_personal add column if not exists door text;
alter table public.staff_personal add column if not exists postal_code text;
alter table public.staff_personal add column if not exists city text;

-- Documentos (metadados) — camada pessoal
create table if not exists public.staff_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  name text not null,
  category text not null default 'outro',
  file_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists staff_docs_staff_idx on public.staff_documents (staff_id);
alter table public.staff_documents enable row level security;
drop policy if exists staff_docs_select on public.staff_documents;
create policy staff_docs_select on public.staff_documents for select to authenticated using (
  public.has_perm('equipa_pessoal', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.entity_type = 'staff' and p.entity_id = staff_documents.staff_id));
drop policy if exists staff_docs_write on public.staff_documents;
create policy staff_docs_write on public.staff_documents for all to authenticated
  using (public.has_perm('equipa_pessoal', true)) with check (public.has_perm('equipa_pessoal', true));

-- Bucket de storage privado para documentos
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists documents_read on storage.objects;
create policy documents_read on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.has_perm('equipa_pessoal', false));
drop policy if exists documents_insert on storage.objects;
create policy documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.has_perm('equipa_pessoal', true));
drop policy if exists documents_delete on storage.objects;
create policy documents_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.has_perm('equipa_pessoal', true));
