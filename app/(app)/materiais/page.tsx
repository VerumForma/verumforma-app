import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import MaterialsWorkspace from '@/components/materials/MaterialsWorkspace'
import { buildCompositeCosts } from '@/lib/materials'
import type { Material, Labour, Composite, CompositeItem } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Materiais · VerumForma' }

export default async function MateriaisPage() {
  if (!supabaseConfigured()) return <MaterialsWorkspace materials={[]} labour={[]} composites={[]} costs={{}} suppliers={[]} canEdit />
  const supabase = createClient()
  const level = await myPermission(supabase, 'materiais')
  if (!canView(level)) redirect('/dashboard')

  const [{ data: materials }, { data: labour }, { data: composites }, { data: items }, { data: suppliers }, { data: materialUnits }] = await Promise.all([
    supabase.from('materials').select('*').order('name'),
    supabase.from('labour').select('*').order('name'),
    supabase.from('composites').select('*').order('name'),
    supabase.from('composite_items').select('*'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('material_units').select('*'),
  ])
  const unitPer: Record<string, Record<string, number>> = {}
  for (const mu of (materialUnits ?? [])) { (unitPer[mu.material_id] ||= {})[mu.label] = mu.per_base }

  const matPrice = Object.fromEntries((materials ?? []).map(m => [m.id, m.current_price ?? 0]))
  const labPrice = Object.fromEntries((labour ?? []).map(l => [l.id, l.hourly_cost ?? 0]))
  const costMap = buildCompositeCosts((composites ?? []) as Composite[], (items ?? []) as CompositeItem[], matPrice, labPrice, unitPer)
  const costs = Object.fromEntries(Object.entries(costMap).map(([id, c]) => [id, c.total]))

  const its = (items ?? []) as CompositeItem[]
  const matComps: Record<string, Set<string>> = {}
  const labComps: Record<string, Set<string>> = {}
  for (const it of its) {
    if (it.kind === 'material' && it.material_id) (matComps[it.material_id] ||= new Set()).add(it.composite_id)
    if (it.kind === 'labour' && it.labour_id) (labComps[it.labour_id] ||= new Set()).add(it.composite_id)
  }
  const matUsage = Object.fromEntries(Object.entries(matComps).map(([k, v]) => [k, v.size]))
  const labUsage = Object.fromEntries(Object.entries(labComps).map(([k, v]) => [k, v.size]))
  const deletedMat = new Set(((materials ?? []) as Material[]).filter(m => m.deleted_at).map(m => m.id))
  const deletedLab = new Set(((labour ?? []) as Labour[]).filter(l => l.deleted_at).map(l => l.id))
  const compAlert = new Set<string>()
  for (const it of its) {
    if (it.kind === 'material' && it.material_id && deletedMat.has(it.material_id)) compAlert.add(it.composite_id)
    if (it.kind === 'labour' && it.labour_id && deletedLab.has(it.labour_id)) compAlert.add(it.composite_id)
  }
  const liveMaterials = ((materials ?? []) as Material[]).filter(m => !m.deleted_at)
  const liveLabour = ((labour ?? []) as Labour[]).filter(l => !l.deleted_at)

  return <MaterialsWorkspace materials={liveMaterials} labour={liveLabour} composites={(composites ?? []) as Composite[]} costs={costs} suppliers={(suppliers ?? []) as { id: string; name: string }[]} matUsage={matUsage} labUsage={labUsage} compAlert={Array.from(compAlert)} canEdit={canEdit(level)} />
}
