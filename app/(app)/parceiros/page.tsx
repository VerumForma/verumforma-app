import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import PartnersManager from '@/components/partners/PartnersManager'
import type { Partner } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Parceiros · VerumForma' }

export default async function ParceirosPage() {
  if (!supabaseConfigured()) return <PartnersManager initial={[]} canEdit />
  const supabase = createClient()
  const level = await myPermission(supabase, 'parceiros')
  if (!canView(level)) redirect('/dashboard')
  const { data } = await supabase.from('partners').select('*').order('name')
  return <PartnersManager initial={(data ?? []) as Partner[]} canEdit={canEdit(level)} />
}
