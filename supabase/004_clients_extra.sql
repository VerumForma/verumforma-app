-- Clientes: línguas faladas + marcador de dados incompletos
alter table public.clients add column if not exists languages text[] not null default '{}';
alter table public.clients add column if not exists incomplete boolean not null default true;
