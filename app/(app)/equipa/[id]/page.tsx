import { notFound, redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/server'
import { getPermissions, canView, canEdit } from '@/lib/permissions'
import TeamDetail from '@/components/team/TeamDetail'
import type { Staff, StaffPersonal, StaffFinance, StaffNotes, StaffCertification, StaffFamily, StaffDocument } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  if (!supabaseConfigured()) notFound()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prof } = await supabase.from('profiles').select('role, entity_type, entity_id').eq('id', user.id).maybeSingle()
  const p = prof as { role?: string; entity_type?: string | null; entity_id?: string | null } | null
  const roleKey = p?.role ?? 'unassigned'
  const isSelf = p?.entity_type === 'staff' && p?.entity_id === params.id
  const perms = await getPermissions(supabase, roleKey)
  const lvl = (m: string) => perms[m]

  if (!canView(lvl('equipa')) && !isSelf) redirect('/dashboard')

  const { data: staffData } = await supabase.from('staff').select('*').eq('id', params.id).maybeSingle()
  if (!staffData) notFound()
  const staff = staffData as Staff

  const [personal, finance, notes, certs, family, documents, roles] = await Promise.all([
    supabase.from('staff_personal').select('*').eq('staff_id', params.id).maybeSingle(),
    supabase.from('staff_finance').select('*').eq('staff_id', params.id).maybeSingle(),
    supabase.from('staff_notes').select('*').eq('staff_id', params.id).order('created_at', { ascending: false }),
    supabase.from('staff_certifications').select('*').eq('staff_id', params.id).order('expiry_date', { nullsFirst: false }),
    supabase.from('staff_family').select('*').eq('staff_id', params.id).order('relation'),
    supabase.from('staff_documents').select('*').eq('staff_id', params.id).order('created_at', { ascending: false }),
    supabase.from('roles').select('key, label_pt').order('sort'),
  ])

  let roleLabel: string | null = null
  if (staff.role) {
    const { data: r } = await supabase.from('roles').select('label_pt').eq('key', staff.role).maybeSingle()
    roleLabel = (r as { label_pt?: string } | null)?.label_pt ?? staff.role
  }

  return (
    <TeamDetail
      staff={staff}
      roleLabel={roleLabel}
      roles={(roles.data ?? []) as { key: string; label_pt: string }[]}
      personal={(personal.data ?? null) as StaffPersonal | null}
      finance={(finance.data ?? null) as StaffFinance | null}
      notes={(notes.data ?? []) as StaffNotes[]}
      certs={(certs.data ?? []) as StaffCertification[]}
      family={(family.data ?? []) as StaffFamily[]}
      documents={(documents.data ?? []) as StaffDocument[]}
      canEditCore={canEdit(lvl('equipa'))}
      canFinance={canView(lvl('equipa_financeiro'))}
      canFinanceEdit={canEdit(lvl('equipa_financeiro'))}
      canPessoal={canView(lvl('equipa_pessoal'))}
      canPessoalEdit={canEdit(lvl('equipa_pessoal'))}
      canNotes={canView(lvl('equipa_notas'))}
      canNotesEdit={canEdit(lvl('equipa_notas'))}
      isSelf={!!isSelf}
    />
  )
}
