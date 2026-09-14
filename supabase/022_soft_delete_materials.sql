-- ============================================================
-- Soft-delete de Materiais e Mão de obra usados em artigos compostos
-- ============================================================
-- Apagar um material/mão de obra que está numa composição marca deleted_at
-- (mantém a linha e o último preço) para o composto continuar a resolvê-lo,
-- mostrando-o como "apagado". Se não estiver em uso, apaga-se a sério.
alter table public.materials add column if not exists deleted_at timestamptz;
alter table public.labour add column if not exists deleted_at timestamptz;
create index if not exists materials_deleted_idx on public.materials (deleted_at);
create index if not exists labour_deleted_idx on public.labour (deleted_at);
