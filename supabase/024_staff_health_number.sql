-- Nº de utente de saúde (SNS) do colaborador (dados pessoais da Equipa)
alter table public.staff_personal add column if not exists health_number text;
