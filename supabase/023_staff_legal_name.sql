-- Nome completo legal do colaborador (dados pessoais da Equipa)
alter table public.staff_personal add column if not exists legal_name text;
