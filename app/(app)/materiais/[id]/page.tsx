import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import MaterialDetail from '@/components/materials/MaterialDetail'
import type { Material, MaterialPrice, MaterialUnit, MaterialExternalRef } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function MaterialDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const level = await myPermission(supabase, 'materiais')
  if (!canView(level)) redirect('/dashboard')

  const { data } = await supabase.from('materials').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  const [{ data: prices }, { data: suppliers }, { data: units }, { data: extRefs }] = await Promise.all([
    supabase.from('material_prices').select('*').eq('material_id', params.id).order('price_date'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('material_units').select('*').eq('material_id', params.id).order('created_at'),
    supabase.from('material_external_refs').select('*').eq('material_id', params.id).order('created_at'),
  ])
  return <MaterialDetail material={data as Material} prices={(prices ?? []) as MaterialPrice[]} suppliers={(suppliers ?? []) as { id: string; name: string }[]} units={(units ?? []) as MaterialUnit[]} extRefs={(extRefs ?? []) as MaterialExternalRef[]} canEdit={canEdit(level)} />
}
