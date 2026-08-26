-- Equipa: marcador de dados incompletos (igual aos outros módulos)
alter table public.staff add column if not exists incomplete boolean not null default true;
