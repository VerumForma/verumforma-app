-- Materiais: compostos aninhados (um artigo composto pode conter outro) + unidades novas
-- Permite kind='composite' em composite_items e referência ao artigo filho.
alter table public.composite_items drop constraint if exists composite_items_kind_check;
alter table public.composite_items add constraint composite_items_kind_check check (kind in ('material','labour','composite'));
alter table public.composite_items add column if not exists composite_ref_id uuid references public.composites(id) on delete set null;

-- Relaxar as unidades (balde, carrinho, tonelada, etc. passam a ser válidos)
alter table public.composites drop constraint if exists composites_unit_check;
alter table public.materials drop constraint if exists materials_unit_check;
