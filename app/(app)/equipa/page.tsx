import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { myPermission, canView, canEdit } from '@/lib/permissions'
import TeamManager from '@/components/team/TeamManager'
import type { Staff } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Equipa · VerumForma' }

export default async function EquipaPage() {
  if (!supabaseConfigured()) return <TeamManager initial={[]} canEdit roles={[]} />
  const supabase = createClient()
  const level = await myPermission(supabase, 'equipa')
  if (!canView(level)) redirect('/dashboard')
  const [{ data: staff }, { data: roles }] = await Promise.all([
    supabase.from('staff').select('*').order('name'),
    supabase.from('roles').select('key, label_pt').order('sort'),
  ])
  return <TeamManager initial={(staff ?? []) as Staff[]} canEdit={canEdit(level)} roles={(roles ?? []) as { key: string; label_pt: string }[]} />
}
