import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import CompositeDetail from '@/components/materials/CompositeDetail'
import { buildCompositeCosts } from '@/lib/materials'
import type { Composite, CompositeItem, Material, Labour, MaterialUnit } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function CompositeDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const level = await myPermission(supabase, 'materiais')
  if (!canView(level)) redirect('/dashboard')
  const { data } = await supabase.from('composites').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  const [{ data: items }, { data: materials }, { data: labour }, { data: materialUnits }, { data: allComposites }, { data: allItems }] = await Promise.all([
    supabase.from('composite_items').select('*').eq('composite_id', params.id).order('sort'),
    supabase.from('materials').select('*').order('name'),
    supabase.from('labour').select('*').order('name'),
    supabase.from('material_units').select('*'),
    supabase.from('composites').select('*').order('name'),
    supabase.from('composite_items').select('*'),
  ])
  const matPrice = Object.fromEntries((materials ?? []).map(m => [m.id, m.current_price ?? 0]))
  const labPrice = Object.fromEntries((labour ?? []).map(l => [l.id, l.hourly_cost ?? 0]))
  const unitPer: Record<string, Record<string, number>> = {}
  for (const mu of (materialUnits ?? [])) { (unitPer[mu.material_id] ||= {})[mu.label] = mu.per_base }
  const costMap = buildCompositeCosts((allComposites ?? []) as Composite[], (allItems ?? []) as CompositeItem[], matPrice, labPrice, unitPer)
  const childCosts = Object.fromEntries(Object.entries(costMap).map(([id, c]) => [id, c.total]))
  return <CompositeDetail composite={data as Composite} items={(items ?? []) as CompositeItem[]} materials={(materials ?? []) as Material[]} labour={(labour ?? []) as Labour[]} materialUnits={(materialUnits ?? []) as MaterialUnit[]} composites={(allComposites ?? []) as { id: string; name: string; unit: string }[]} childCosts={childCosts} canEdit={canEdit(level)} />
}
