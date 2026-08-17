import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import PartnerDetail from '@/components/partners/PartnerDetail'
import type { Partner, PartnerContact } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function PartnerDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const level = await myPermission(supabase, 'parceiros')
  if (!canView(level)) redirect('/dashboard')

  const { data } = await supabase.from('partners').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()

  const { data: contacts } = await supabase
    .from('partner_contacts').select('*').eq('partner_id', params.id)
    .order('is_primary', { ascending: false }).order('name')

  return <PartnerDetail partner={data as Partner} canEdit={canEdit(level)} initialContacts={(contacts ?? []) as PartnerContact[]} />
}
