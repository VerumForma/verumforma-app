import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import LabourDetail from '@/components/materials/LabourDetail'
import type { Labour, LabourPrice } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function LabourDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const level = await myPermission(supabase, 'materiais')
  if (!canView(level)) redirect('/dashboard')
  const { data } = await supabase.from('labour').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  const { data: prices } = await supabase.from('labour_prices').select('*').eq('labour_id', params.id).order('price_date')
  return <LabourDetail labour={data as Labour} prices={(prices ?? []) as LabourPrice[]} canEdit={canEdit(level)} />
}
