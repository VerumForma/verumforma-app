-- Clientes: foto/logótipo + redes sociais
alter table public.clients add column if not exists photo text;
alter table public.clients add column if not exists instagram text;
alter table public.clients add column if not exists facebook text;
alter table public.clients add column if not exists x text;
alter table public.clients add column if not exists linkedin text;
